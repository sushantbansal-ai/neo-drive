import { Injectable } from '@nestjs/common';
import { VehicleReservationStats } from '../shared/models/booking.model';
import { VehicleModel } from '../shared/models/vehicle.model';

@Injectable()
export class BookingDistributionService {
  selectVehicle(
    vehicles: VehicleModel[],
    stats: VehicleReservationStats[],
  ): VehicleModel | null {
    if (vehicles.length === 0) {
      return null;
    }

    const statsByVehicleId = new Map(
      stats.map((vehicleStats) => [vehicleStats.vehicleId, vehicleStats]),
    );

    return [...vehicles].sort((left, right) => {
      const leftStats = statsByVehicleId.get(left.id);
      const rightStats = statsByVehicleId.get(right.id);
      const countDifference =
        (leftStats?.reservationCount ?? 0) -
        (rightStats?.reservationCount ?? 0);

      if (countDifference !== 0) {
        return countDifference;
      }

      const lastReservationDifference =
        this.toComparableTime(leftStats?.lastReservationEndDateTime) -
        this.toComparableTime(rightStats?.lastReservationEndDateTime);

      if (lastReservationDifference !== 0) {
        return lastReservationDifference;
      }

      return left.id.localeCompare(right.id);
    })[0];
  }

  private toComparableTime(date?: Date): number {
    return date?.getTime() ?? 0;
  }
}
