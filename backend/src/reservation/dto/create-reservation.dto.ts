import { ApiProperty } from '@nestjs/swagger';
import { CreateReservationRequest } from '../../shared/models/booking.model';

export class CreateReservationDto implements CreateReservationRequest {
  @ApiProperty({ example: 'tesla_1001' })
  vehicleId!: string;

  @ApiProperty({ example: '2026-07-21T09:00:00Z' })
  startDateTime!: string;

  @ApiProperty({ example: 45 })
  durationMins!: number;

  @ApiProperty({ example: 'John Smith' })
  customerName!: string;

  @ApiProperty({ example: 'john@example.com' })
  customerEmail!: string;

  @ApiProperty({ example: '+353851234567' })
  customerPhone!: string;
}
