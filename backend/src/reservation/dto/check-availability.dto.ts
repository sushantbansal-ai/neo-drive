import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min, Max } from 'class-validator';
import { BookingAvailabilityRequest } from '../../shared/models/booking.model';

const MAX_BOOKING_DURATION_MINS = process.env.MAX_BOOKING_DURATION_MINS ? parseInt(process.env.MAX_BOOKING_DURATION_MINS) : 360;

export class CheckAvailabilityDto implements BookingAvailabilityRequest {
  @ApiProperty({ example: 'dublin' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: 'tesla_model3' })
  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @ApiProperty({ example: '2026-07-21T09:00:00Z' })
  @IsDateString()
  startDateTime!: string;

  @ApiProperty({ example: 45, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_BOOKING_DURATION_MINS, { message: 'duration can be between 1 min upto 6 hours.' })
  durationMins!: number;
}
