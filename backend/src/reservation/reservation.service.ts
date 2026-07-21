import { Injectable } from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import {
  BookingAvailabilityResult,
  ReservationModel,
} from '../shared/models/booking.model';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly bookingService: BookingService) {}

  checkAvailability(
    request: CheckAvailabilityDto,
  ): Promise<BookingAvailabilityResult> {
    return this.bookingService.findAvailability(request);
  }

  createReservation(request: CreateReservationDto): Promise<ReservationModel> {
    return this.bookingService.bookReservation(request);
  }
}
