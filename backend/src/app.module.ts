import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VechilesModule } from './vechiles/vechiles.module';
import { ReservationModule } from './reservation/reservation.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [PrismaModule, VechilesModule, ReservationModule, BookingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
