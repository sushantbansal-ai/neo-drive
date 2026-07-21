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
  availabilityRules: VehicleAvailabilityRuleModel[];
};

export type VehicleAvailabilityRuleModel = {
  location: string;
  availableFromTime: string;
  availableToTime: string;
  availableDays: string[];
  minimumMinutesBetweenBookings: number;
};

type VehicleAvailabilityRecord = Pick<
  VehicleModel,
  | 'location'
  | 'availableFromTime'
  | 'availableToTime'
  | 'availableDays'
  | 'minimumMinutesBetweenBookings'
>;

export function toVehicleAvailabilityRuleModel(
  vehicle: VehicleAvailabilityRecord,
): VehicleAvailabilityRuleModel {
  return {
    location: vehicle.location,
    availableFromTime: vehicle.availableFromTime,
    availableToTime: vehicle.availableToTime,
    availableDays: vehicle.availableDays,
    minimumMinutesBetweenBookings: vehicle.minimumMinutesBetweenBookings,
  };
}

export function toUniqueVehicleAvailabilityRuleModels(
  vehicles: VehicleAvailabilityRecord[],
): VehicleAvailabilityRuleModel[] {
  const rulesByKey = new Map<string, VehicleAvailabilityRuleModel>();

  for (const vehicle of vehicles) {
    const rule = toVehicleAvailabilityRuleModel(vehicle);
    const key = [
      rule.location,
      rule.availableFromTime,
      rule.availableToTime,
      rule.availableDays.join(','),
      rule.minimumMinutesBetweenBookings,
    ].join('|');

    rulesByKey.set(key, rule);
  }

  return Array.from(rulesByKey.values());
}
