import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReservationModule } from './reservation/reservation.module';
import { BookingModule } from './booking/booking.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [PrismaModule, VehiclesModule, ReservationModule, BookingModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
