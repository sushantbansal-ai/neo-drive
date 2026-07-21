import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { CreateReservationRequest } from '../../shared/models/booking.model';

const MAX_BOOKING_DURATION_MINS = process.env.MAX_BOOKING_DURATION_MINS ? parseInt(process.env.MAX_BOOKING_DURATION_MINS) : 360;

export class CreateReservationDto implements CreateReservationRequest {
  @ApiProperty({ example: 'tesla_1001' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiProperty({ example: '2026-07-21T09:00:00Z' })
  @IsDateString()
  startDateTime!: string;

  @ApiProperty({ example: 45, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_BOOKING_DURATION_MINS, { message: 'duration can be between 1 min upto 6 hours.' })
  durationMins!: number;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: '9999999999' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone!: string;
}
