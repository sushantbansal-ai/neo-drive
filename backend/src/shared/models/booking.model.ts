import { VehicleModel } from './vehicle.model';

export type BookingAvailabilityRequest = {
  location: string;
  vehicleType: string;
  startDateTime: string | Date;
  durationMins: number;
};

export type CreateReservationRequest = {
  vehicleId: string;
  startDateTime: string | Date;
  durationMins: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type BookingWindow = {
  startDateTime: Date;
  endDateTime: Date;
};

export type VehicleReservationStats = {
  vehicleId: string;
  reservationCount: number;
  lastReservationEndDateTime?: Date | null;
};

export type BookingAvailabilityResult = {
  available: boolean;
  vehicle: VehicleModel | null;
  startDateTime: string;
  endDateTime: string;
};

export type ReservationModel = {
  id: number;
  vehicleId: string;
  startDateTime: string;
  endDateTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};
