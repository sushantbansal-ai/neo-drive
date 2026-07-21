export type Vehicle = {
  id: string
  type: string
  location: string
  availableFromTime: string
  availableToTime: string
  availableDays: string[]
  minimumMinutesBetweenBookings: number
}

export type VehicleMeta = {
  locations: string[]
  vehicleTypes: string[]
  availabilityRules: VehicleAvailabilityRule[]
}

export type VehicleAvailabilityRule = {
  location: string
  availableFromTime: string
  availableToTime: string
  availableDays: string[]
  minimumMinutesBetweenBookings: number
}

export type AvailabilityResult = {
  available: boolean
  vehicle: Vehicle | null
  startDateTime: string
  endDateTime: string
}

export type ReservationResult = {
  id: number
  vehicleId: string
  startDateTime: string
  endDateTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

export type AvailabilityRequest = {
  location: string
  vehicleType: string
  startDateTime: string
  durationMins: number
}

export type CreateReservationRequest = {
  vehicleId: string
  startDateTime: string
  durationMins: number
  customerName: string
  customerEmail: string
  customerPhone: string
}
