jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { BookingConflictService } from './booking-conflict.service';
import { BookingDistributionService } from './booking-distribution.service';
import { BookingPolicyService } from './booking-policy.service';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  const prisma = {
    vehicle: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: BookingService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    service = new BookingService(
      prisma as never,
      new BookingPolicyService(),
      new BookingConflictService(),
      new BookingDistributionService(),
    );
  });

  it('finds an available vehicle using normalized location and type', async () => {
    prisma.vehicle.findMany.mockResolvedValue([
      {
        id: 'tesla_1001',
        type: 'tesla_model3',
        location: 'dublin',
        availableFromTime: '08:00:00',
        availableToTime: '18:00:00',
        availableDays: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
        minimumMinutesBetweenBookings: 15,
        reservations: [
          {
            vehicleId: 'tesla_1001',
            startDateTime: new Date('2026-07-21T09:00:00Z'),
            endDateTime: new Date('2026-07-21T09:45:00Z'),
          },
        ],
        createdAt: new Date('2026-07-20T00:00:00Z'),
        updatedAt: new Date('2026-07-20T00:00:00Z'),
      },
      {
        id: 'tesla_1002',
        type: 'tesla_model3',
        location: 'dublin',
        availableFromTime: '08:00:00',
        availableToTime: '18:00:00',
        availableDays: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
        minimumMinutesBetweenBookings: 15,
        reservations: [],
        createdAt: new Date('2026-07-20T00:00:00Z'),
        updatedAt: new Date('2026-07-20T00:00:00Z'),
      },
    ]);

    await expect(
      service.findAvailability({
        location: ' Dublin ',
        vehicleType: 'Tesla_Model3',
        startDateTime: '2026-07-21T10:00:00Z',
        durationMins: 45,
      }),
    ).resolves.toEqual({
      available: true,
      vehicle: {
        id: 'tesla_1002',
        type: 'tesla_model3',
        location: 'dublin',
        availableFromTime: '08:00:00',
        availableToTime: '18:00:00',
        availableDays: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
        minimumMinutesBetweenBookings: 15,
      },
      startDateTime: '2026-07-21T10:00:00.000Z',
      endDateTime: '2026-07-21T10:45:00.000Z',
    });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
      where: {
        location: 'dublin',
        type: 'tesla_model3',
      },
      include: {
        reservations: true,
      },
      orderBy: [{ location: 'asc' }, { type: 'asc' }, { id: 'asc' }],
    });
  });

  it('books a reservation inside a transaction after locking and rechecking the vehicle', async () => {
    const tx = {
      $executeRaw: jest.fn(),
      vehicle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tesla_1001',
          type: 'tesla_model3',
          location: 'dublin',
          availableFromTime: '08:00:00',
          availableToTime: '18:00:00',
          availableDays: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
          minimumMinutesBetweenBookings: 15,
          reservations: [],
          createdAt: new Date('2026-07-20T00:00:00Z'),
          updatedAt: new Date('2026-07-20T00:00:00Z'),
        }),
      },
      reservation: {
        create: jest.fn().mockResolvedValue({
          id: 1,
          vehicleId: 'tesla_1001',
          startDateTime: new Date('2026-07-21T10:00:00Z'),
          endDateTime: new Date('2026-07-21T10:45:00Z'),
          customerName: 'John Smith',
          customerEmail: 'john@example.com',
          customerPhone: '+353851234567',
        }),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await expect(
      service.bookReservation({
        vehicleId: 'tesla_1001',
        startDateTime: '2026-07-21T10:00:00Z',
        durationMins: 45,
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '+353851234567',
      }),
    ).resolves.toEqual({
      id: 1,
      vehicleId: 'tesla_1001',
      startDateTime: '2026-07-21T10:00:00.000Z',
      endDateTime: '2026-07-21T10:45:00.000Z',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerPhone: '+353851234567',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.vehicle.findUnique).toHaveBeenCalledWith({
      where: { id: 'tesla_1001' },
      include: { reservations: true },
    });
    expect(tx.reservation.create).toHaveBeenCalledWith({
      data: {
        vehicleId: 'tesla_1001',
        startDateTime: new Date('2026-07-21T10:00:00Z'),
        endDateTime: new Date('2026-07-21T10:45:00Z'),
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '+353851234567',
      },
    });
  });

  it('rejects booking when the vehicle has a conflicting reservation', async () => {
    const tx = {
      $executeRaw: jest.fn(),
      vehicle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tesla_1001',
          type: 'tesla_model3',
          location: 'dublin',
          availableFromTime: '08:00:00',
          availableToTime: '18:00:00',
          availableDays: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
          minimumMinutesBetweenBookings: 15,
          reservations: [
            {
              vehicleId: 'tesla_1001',
              startDateTime: new Date('2026-07-21T09:30:00Z'),
              endDateTime: new Date('2026-07-21T10:15:00Z'),
            },
          ],
          createdAt: new Date('2026-07-20T00:00:00Z'),
          updatedAt: new Date('2026-07-20T00:00:00Z'),
        }),
      },
      reservation: {
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await expect(
      service.bookReservation({
        vehicleId: 'tesla_1001',
        startDateTime: '2026-07-21T10:00:00Z',
        durationMins: 45,
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '+353851234567',
      }),
    ).rejects.toThrow('Vehicle already has a reservation');

    expect(tx.reservation.create).not.toHaveBeenCalled();
  });
});
