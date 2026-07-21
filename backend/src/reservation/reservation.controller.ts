import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  BookingAvailabilityResult,
  ReservationModel,
} from '../shared/models/booking.model';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationService } from './reservation.service';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('availability')
  @ApiOkResponse({ description: 'Returns the best available vehicle slot.' })
  checkAvailability(
    @Body() request: CheckAvailabilityDto,
  ): Promise<BookingAvailabilityResult> {
    return this.reservationService.checkAvailability(request);
  }

  @Post()
  @ApiCreatedResponse({ description: 'Creates a reservation if the slot is available.' })
  createReservation(
    @Body() request: CreateReservationDto,
  ): Promise<ReservationModel> {
    return this.reservationService.createReservation(request);
  }
}
