import { Injectable } from '@nestjs/common';
import { VehicleModel } from '../shared/models/vehicle.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingDistributionService {
  constructor(private readonly prisma: PrismaService) { }

  async selectVehicle(
    vehicles: VehicleModel[],
  ): Promise<VehicleModel | null> {
    if (vehicles.length === 0) {
      return null;
    }

    const vehicleStats = await this.prisma.vehicleReservationStats.findMany({
      where: {
        vehicleId: {
          in: vehicles.map((vehicle) => vehicle.id),
        },
      },
      orderBy: [{ reservationCount: 'asc', }, { lastReservationEndDateTime: 'desc' }],
    });

    return vehicleStats.length > 0
      ? vehicles.find((vehicle) => vehicle.id === vehicleStats[0].vehicleId) ?? null
      : vehicles[0];
  }
}
