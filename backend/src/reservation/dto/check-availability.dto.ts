import { ApiProperty } from '@nestjs/swagger';
import { BookingAvailabilityRequest } from '../../shared/models/booking.model';

export class CheckAvailabilityDto implements BookingAvailabilityRequest {
  @ApiProperty({ example: 'dublin' })
  location!: string;

  @ApiProperty({ example: 'tesla_model3' })
  vehicleType!: string;

  @ApiProperty({ example: '2026-07-21T09:00:00Z' })
  startDateTime!: string;

  @ApiProperty({ example: 45 })
  durationMins!: number;
}
