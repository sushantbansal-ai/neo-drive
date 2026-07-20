export type VehicleModel = {
  id: string;
  type: string;
  location: string;
  availableFromTime: string;
  availableToTime: string;
  availableDays: string[];
  minimumMinutesBetweenBookings: number;
};

type VehicleRecord = VehicleModel & {
  createdAt?: Date;
  updatedAt?: Date;
};

export function toVehicleModel(vehicle: VehicleRecord): VehicleModel {
  return {
    id: vehicle.id,
    type: vehicle.type,
    location: vehicle.location,
    availableFromTime: vehicle.availableFromTime,
    availableToTime: vehicle.availableToTime,
    availableDays: vehicle.availableDays,
    minimumMinutesBetweenBookings: vehicle.minimumMinutesBetweenBookings,
  };
}

export type VehicleMetaModel = {
  locations: string[];
  vehicleTypes: string[];
};
