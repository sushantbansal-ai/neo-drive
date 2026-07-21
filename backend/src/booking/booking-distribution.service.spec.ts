jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { BookingDistributionService } from './booking-distribution.service';

describe('BookingDistributionService', () => {
  const prisma = {
    vehicleReservationStats: {
      findMany: jest.fn(),
    },
  };

  let service: BookingDistributionService;

  const vehicles = [
    {
      id: 'tesla_1001',
      type: 'tesla_model3',
      location: 'dublin',
      availableFromTime: '08:00:00',
      availableToTime: '18:00:00',
      availableDays: ['mon'],
      minimumMinutesBetweenBookings: 15,
    },
    {
      id: 'tesla_1002',
      type: 'tesla_model3',
      location: 'dublin',
      availableFromTime: '08:00:00',
      availableToTime: '18:00:00',
      availableDays: ['mon'],
      minimumMinutesBetweenBookings: 15,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingDistributionService(prisma as never);
  });

  it('returns null when no vehicles are available', async () => {
    await expect(service.selectVehicle([])).resolves.toBeNull();
    expect(prisma.vehicleReservationStats.findMany).not.toHaveBeenCalled();
  });

  it('selects the vehicle with the fewest reservations', async () => {
    prisma.vehicleReservationStats.findMany.mockResolvedValue([
      {
        vehicleId: 'tesla_1001',
        reservationCount: 3,
        lastReservationEndDateTime: new Date('2026-07-21T09:45:00Z'),
      },
      {
        vehicleId: 'tesla_1002',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
      },
    ]);

    await expect(service.selectVehicle(vehicles)).resolves.toEqual(vehicles[1]);
    expect(prisma.vehicleReservationStats.findMany).toHaveBeenCalledWith({
      where: {
        vehicleId: {
          in: ['tesla_1001', 'tesla_1002'],
        },
      },
    });
  });

  it('treats vehicles missing stats as unused', async () => {
    prisma.vehicleReservationStats.findMany.mockResolvedValue([
      {
        vehicleId: 'tesla_1001',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T09:45:00Z'),
      },
    ]);

    await expect(service.selectVehicle(vehicles)).resolves.toEqual(vehicles[1]);
  });

  it('uses last reservation time then id as deterministic tie breakers', async () => {
    prisma.vehicleReservationStats.findMany.mockResolvedValue([
      {
        vehicleId: 'tesla_1001',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
      },
      {
        vehicleId: 'tesla_1002',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
      },
    ]);

    await expect(service.selectVehicle(vehicles)).resolves.toEqual(vehicles[0]);
  });

  it('prefers the vehicle whose last reservation ended earlier on count ties', async () => {
    prisma.vehicleReservationStats.findMany.mockResolvedValue([
      {
        vehicleId: 'tesla_1001',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T11:45:00Z'),
      },
      {
        vehicleId: 'tesla_1002',
        reservationCount: 1,
        lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
      },
    ]);

    await expect(service.selectVehicle(vehicles)).resolves.toEqual(vehicles[1]);
  });
});
