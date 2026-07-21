import { Module } from '@nestjs/common';
import { BookingConflictService } from './booking-conflict.service';
import { BookingDistributionService } from './booking-distribution.service';
import { BookingPolicyService } from './booking-policy.service';
import { BookingService } from './booking.service';

@Module({
  providers: [
    BookingService,
    BookingPolicyService,
    BookingConflictService,
    BookingDistributionService,
  ],
  exports: [
    BookingService,
    BookingPolicyService,
    BookingConflictService,
    BookingDistributionService,
  ],
})
export class BookingModule {}
