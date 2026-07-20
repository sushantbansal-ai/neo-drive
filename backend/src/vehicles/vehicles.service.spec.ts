import { NotFoundException } from '@nestjs/common';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const prisma = {
    vehicle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  let service: VehiclesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VehiclesService(prisma as never);
  });

  it('normalizes location and type filters before querying vehicles', async () => {
    prisma.vehicle.findMany.mockResolvedValue([
      {
        id: 'tesla_1001',
        type: 'tesla_model3',
        location: 'dublin',
        availableFromTime: '08:00:00',
        availableToTime: '18:00:00',
        availableDays: ['mon', 'tue'],
        minimumMinutesBetweenBookings: 15,
        createdAt: new Date('2026-07-20T00:00:00Z'),
        updatedAt: new Date('2026-07-20T00:00:00Z'),
      },
    ]);

    const result = await service.findAll({
      location: ' Dublin ',
      type: 'Tesla_Model3',
    });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
      where: {
        location: 'dublin',
        type: 'tesla_model3',
      },
      orderBy: [{ location: 'asc' }, { type: 'asc' }, { id: 'asc' }],
    });
    expect(result).toEqual([
      {
        id: 'tesla_1001',
        type: 'tesla_model3',
        location: 'dublin',
        availableFromTime: '08:00:00',
        availableToTime: '18:00:00',
        availableDays: ['mon', 'tue'],
        minimumMinutesBetweenBookings: 15,
      },
    ]);
  });

  it('returns unique sorted locations and vehicle types for metadata', async () => {
    prisma.vehicle.findMany.mockResolvedValue([
      { location: 'dublin', type: 'tesla_modelx' },
      { location: 'cork', type: 'tesla_model3' },
      { location: 'dublin', type: 'tesla_model3' },
    ]);

    await expect(service.getMeta()).resolves.toEqual({
      locations: ['cork', 'dublin'],
      vehicleTypes: ['tesla_model3', 'tesla_modelx'],
    });
  });

  it('throws when a vehicle cannot be found', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps a found vehicle to the public vehicle model', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'tesla_1002',
      type: 'tesla_modelx',
      location: 'dublin',
      availableFromTime: '10:00:00',
      availableToTime: '20:00:00',
      availableDays: ['mon', 'sat'],
      minimumMinutesBetweenBookings: 15,
      createdAt: new Date('2026-07-20T00:00:00Z'),
      updatedAt: new Date('2026-07-20T00:00:00Z'),
    });

    await expect(service.findOne('tesla_1002')).resolves.toEqual({
      id: 'tesla_1002',
      type: 'tesla_modelx',
      location: 'dublin',
      availableFromTime: '10:00:00',
      availableToTime: '20:00:00',
      availableDays: ['mon', 'sat'],
      minimumMinutesBetweenBookings: 15,
    });
  });
});
