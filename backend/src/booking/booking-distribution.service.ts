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
    });

    const vehiclesWithStats = vehicles.map(vehicle => {
      const stats = vehicleStats.find(stat => stat.vehicleId === vehicle.id);
      return {
        ...vehicle,
        reservationCount: stats ? stats.reservationCount : 0,
        lastReservationEndDateTime: stats ? stats.lastReservationEndDateTime : null,
      };
    }
    );

    vehiclesWithStats.sort((a, b) => {
      if (a.reservationCount !== b.reservationCount) {
        return a.reservationCount - b.reservationCount;
      }
      if (a.lastReservationEndDateTime && b.lastReservationEndDateTime) {
        return new Date(a.lastReservationEndDateTime).getTime() - new Date(b.lastReservationEndDateTime).getTime();
      }
      if (a.lastReservationEndDateTime) {
        return 1;
      }
      if (b.lastReservationEndDateTime) {
        return -1;
      }
      return 0;
    });

    const selectedVehicle = vehiclesWithStats[0];

    return selectedVehicle;
  }
}
