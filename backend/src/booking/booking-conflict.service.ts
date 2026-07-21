import { Injectable } from '@nestjs/common';
import { BookingWindow } from '../shared/models/booking.model';
import { ReservationWindow } from '../shared/models/reservation.model';
import { addMinutes, subtractMinutes } from '../shared/utils/date.utils';

@Injectable()
export class BookingConflictService {
  hasConflict(
    reservations: ReservationWindow[],
    window: BookingWindow,
    minimumMinutesBetweenBookings: number,
  ): boolean {
    const bufferedStart = subtractMinutes(
      window.startDateTime,
      minimumMinutesBetweenBookings,
    );
    const bufferedEnd = addMinutes(
      window.endDateTime,
      minimumMinutesBetweenBookings,
    );

    return reservations.some(
      (reservation) =>
        reservation.startDateTime < bufferedEnd &&
        reservation.endDateTime > bufferedStart,
    );
  }
}
