import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Min,
} from 'class-validator';
import { CreateReservationRequest } from '../../shared/models/booking.model';

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
  durationMins!: number;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ example: '+353851234567' })
  @IsPhoneNumber()
  customerPhone!: string;
}
