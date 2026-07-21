import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingAvailabilityRequest,
  BookingAvailabilityResult,
  CreateReservationRequest,
  ReservationModel,
} from '../shared/models/booking.model';
import { ReservationWindow } from '../shared/models/reservation.model';
import { toVehicleModel, VehicleModel } from '../shared/models/vehicle.model';
import { addMinutes, subtractMinutes } from '../shared/utils/date.utils';
import { normalizeText } from '../shared/utils/string.utils';
import { BookingConflictService } from './booking-conflict.service';
import { BookingDistributionService } from './booking-distribution.service';
import { BookingPolicyService } from './booking-policy.service';

const MAX_BOOKING_DURATION_MINS = process.env.MAX_BOOKING_DURATION_MINS
  ? parseInt(process.env.MAX_BOOKING_DURATION_MINS)
  : 360;
const RESERVATION_LOOKUP_BUFFER_MINS = MAX_BOOKING_DURATION_MINS + 120;

type BookingTransaction = Pick<
  PrismaService,
  '$executeRaw' | 'vehicle' | 'reservation' | 'vehicleReservationStats'
>;

type ReservationRecord = {
  id: number;
  vehicleId: string;
  startDateTime: Date;
  endDateTime: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: BookingPolicyService,
    private readonly conflicts: BookingConflictService,
    private readonly distribution: BookingDistributionService,
  ) {}

  async findAvailability(
    request: BookingAvailabilityRequest,
  ): Promise<BookingAvailabilityResult> {
    const location = normalizeText(request.location);
    const vehicleType = normalizeText(request.vehicleType);
    const window = this.policy.createWindow(
      request.startDateTime,
      request.durationMins,
    );

    this.policy.bookingValidation(window.startDateTime);

    if (!location || !vehicleType) {
      return this.toAvailabilityResult(null, window);
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        location,
        type: vehicleType,
      },
      orderBy: [{ location: 'asc' }, { type: 'asc' }, { id: 'asc' }],
    });

    if (vehicles.length === 0) {
      return this.toAvailabilityResult(null, window);
    }

    const filteredVehicles = vehicles.filter((vehicle) =>
      this.policy.isVehicleAvailableForWindow(toVehicleModel(vehicle), window),
    );

    if (filteredVehicles.length === 0) {
      return this.toAvailabilityResult(null, window);
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        vehicleId: {
          in: filteredVehicles.map((vehicle) => vehicle.id),
        },
        startDateTime: {
          lte: addMinutes(window.startDateTime, RESERVATION_LOOKUP_BUFFER_MINS),
        },
        endDateTime: {
          gte: subtractMinutes(
            window.startDateTime,
            RESERVATION_LOOKUP_BUFFER_MINS,
          ),
        },
      },
      orderBy: [{ vehicleId: 'asc' }, { startDateTime: 'asc' }],
    });

    const availableVehicles = filteredVehicles.filter(
      (vehicle) =>
        !this.conflicts.hasConflict(
          reservations.filter(
            (reservation) => reservation.vehicleId === vehicle.id,
          ),
          window,
          vehicle.minimumMinutesBetweenBookings,
        ),
    );

    const selectedVehicle = await this.distribution.selectVehicle(
      availableVehicles.map(toVehicleModel),
    );

    return this.toAvailabilityResult(selectedVehicle, window);
  }

  async bookReservation(
    request: CreateReservationRequest,
  ): Promise<ReservationModel> {
    const window = this.policy.createWindow(
      request.startDateTime,
      request.durationMins,
    );
    this.policy.bookingValidation(window.startDateTime);

    return this.prisma.$transaction(async (tx) => {
      await this.lockVehicleForTransaction(tx, request.vehicleId);

      const vehicle = await tx.vehicle.findUnique({
        where: { id: request.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle ${request.vehicleId} was not found.`,
        );
      }

      const vehicleModel = toVehicleModel(vehicle);
      const reservations = await tx.reservation.findMany({
        where: {
          vehicleId: request.vehicleId,
          startDateTime: {
            lte: addMinutes(
              window.startDateTime,
              RESERVATION_LOOKUP_BUFFER_MINS,
            ),
          },
          endDateTime: {
            gte: subtractMinutes(
              window.startDateTime,
              RESERVATION_LOOKUP_BUFFER_MINS,
            ),
          },
        },
        orderBy: [{ startDateTime: 'asc' }],
      });

      if (!this.policy.isVehicleAvailableForWindow(vehicleModel, window)) {
        throw new ConflictException(
          'Vehicle is not available for the requested time window.',
        );
      }

      if (
        this.conflicts.hasConflict(
          reservations,
          window,
          vehicle.minimumMinutesBetweenBookings,
        )
      ) {
        throw new ConflictException(
          'Vehicle already has a reservation for the requested time window.',
        );
      }

      const reservation = await tx.reservation.create({
        data: {
          vehicleId: request.vehicleId,
          startDateTime: window.startDateTime,
          endDateTime: window.endDateTime,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
        },
      });

      await this.incrementVehicleReservationStats(
        tx,
        request.vehicleId,
        window.endDateTime,
      );

      return this.toReservationModel(reservation);
    });
  }

  private async lockVehicleForTransaction(
    tx: BookingTransaction,
    vehicleId: string,
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vehicleId}))`;
  }

  private async incrementVehicleReservationStats(
    tx: BookingTransaction,
    vehicleId: string,
    reservationEndDateTime: Date,
  ) {
    await tx.vehicleReservationStats.upsert({
      where: { vehicleId },
      create: {
        vehicleId,
        reservationCount: 1,
        lastReservationEndDateTime: reservationEndDateTime,
      },
      update: {
        reservationCount: {
          increment: 1,
        },
        lastReservationEndDateTime: {
          set: reservationEndDateTime,
        },
      },
    });
  }

  private toAvailabilityResult(
    vehicle: VehicleModel | null,
    window: {
      startDateTime: Date;
      endDateTime: Date;
    },
  ): BookingAvailabilityResult {
    return {
      available: vehicle !== null,
      vehicle,
      startDateTime: window.startDateTime.toISOString(),
      endDateTime: window.endDateTime.toISOString(),
    };
  }

  private toReservationModel(reservation: ReservationRecord): ReservationModel {
    return {
      id: reservation.id,
      vehicleId: reservation.vehicleId,
      startDateTime: reservation.startDateTime.toISOString(),
      endDateTime: reservation.endDateTime.toISOString(),
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
    };
  }
}
