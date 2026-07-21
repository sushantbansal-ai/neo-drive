import { Injectable } from '@nestjs/common';
import { VehicleModel } from '../shared/models/vehicle.model';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingDistributionService {
  constructor(private readonly prisma: PrismaService) {}

  async selectVehicle(vehicles: VehicleModel[]): Promise<VehicleModel | null> {
    if (vehicles.length === 0) {
      return null;
    }

    const vehicleStats = await this.prisma.vehicleReservationStats.findMany({
      where: {
        vehicleId: {
          in: vehicles.map((vehicle) => vehicle.id),
        },
      },
    });

    const statsByVehicleId = new Map(
      vehicleStats.map((stats) => [stats.vehicleId, stats]),
    );

    const vehiclesWithStats = vehicles.map((vehicle) => {
      const stats = statsByVehicleId.get(vehicle.id);

      return {
        vehicle,
        reservationCount: stats ? stats.reservationCount : 0,
        lastReservationEndDateTime: stats
          ? stats.lastReservationEndDateTime
          : null,
      };
    });

    vehiclesWithStats.sort((a, b) => {
      if (a.reservationCount !== b.reservationCount) {
        return a.reservationCount - b.reservationCount;
      }
      if (a.lastReservationEndDateTime && b.lastReservationEndDateTime) {
        const dateComparison =
          new Date(a.lastReservationEndDateTime).getTime() -
          new Date(b.lastReservationEndDateTime).getTime();

        if (dateComparison !== 0) {
          return dateComparison;
        }
      }
      if (a.lastReservationEndDateTime) {
        return 1;
      }
      if (b.lastReservationEndDateTime) {
        return -1;
      }

      return a.vehicle.id.localeCompare(b.vehicle.id);
    });

    return vehiclesWithStats[0].vehicle;
  }
}
