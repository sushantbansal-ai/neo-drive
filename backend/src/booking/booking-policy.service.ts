import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingWindow } from '../shared/models/booking.model';
import { VehicleModel } from '../shared/models/vehicle.model';
import { addMinutes, isValidDate, toUtcTime } from '../shared/utils/date.utils';

const DAY_TOKENS = ['sun', 'mon', 'tue', 'wed', 'thur', 'fri', 'sat'];
const DEFAULT_BOOKING_HORIZON_DAYS = process.env.BOOKING_HORIZON_DAYS ? parseInt(process.env.BOOKING_HORIZON_DAYS, 10) : 14;

@Injectable()
export class BookingPolicyService {
  createWindow(startDateTime: string | Date, durationMins: number): BookingWindow {
    if (!Number.isInteger(durationMins) || durationMins <= 0) {
      throw new BadRequestException('durationMins must be a positive integer.');
    }

    const start =
      startDateTime instanceof Date ? startDateTime : new Date(startDateTime);

    if (!isValidDate(start)) {
      throw new BadRequestException('startDateTime must be a valid datetime.');
    }

    const end = addMinutes(start, durationMins);

    return {
      startDateTime: start,
      endDateTime: end,
    };
  }

  bookingValidation(
    startDateTime: Date,
    now = new Date(),
    horizonDays = DEFAULT_BOOKING_HORIZON_DAYS,
  ) {
    const maxStartDateTime = new Date(
      now.getTime() + horizonDays * 24 * 60 * 60_000,
    );

    if (startDateTime < now) {
      throw new BadRequestException('Bookings cannot be made in the past.');
    }

    if (startDateTime > maxStartDateTime) {
      throw new BadRequestException(
        `Bookings are only available up to ${horizonDays} days in the future.`,
      );
    }
  }

  isVehicleAvailableForWindow(
    vehicle: VehicleModel,
    { startDateTime, endDateTime }: BookingWindow,
  ): boolean {
    return (
      this.isAvailableDay(vehicle, startDateTime) &&
      this.isInsideAvailableHours(vehicle, startDateTime, endDateTime)
    );
  }

  private isAvailableDay(vehicle: VehicleModel, startDateTime: Date): boolean {
    const dayToken = DAY_TOKENS[startDateTime.getUTCDay()];
    return vehicle.availableDays.includes(dayToken);
  }

  private isInsideAvailableHours(
    vehicle: VehicleModel,
    startDateTime: Date,
    endDateTime: Date,
  ): boolean {
    const startTime = toUtcTime(startDateTime);
    const endTime = toUtcTime(endDateTime);

    return (
      startTime >= vehicle.availableFromTime && endTime <= vehicle.availableToTime
    );
  }
}
