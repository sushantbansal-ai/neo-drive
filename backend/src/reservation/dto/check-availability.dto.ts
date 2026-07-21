import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { BookingAvailabilityRequest } from '../../shared/models/booking.model';

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
  durationMins!: number;
}
