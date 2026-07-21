import axios, { AxiosError } from 'axios'
import type {
  AvailabilityRequest,
  AvailabilityResult,
  CreateReservationRequest,
  ReservationResult,
  VehicleMeta,
} from './bookingTypes'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) {
      return message.join(' ')
    }
    if (typeof message === 'string') {
      return message
    }
  }

  return error instanceof Error ? error.message : 'Request failed.'
}

export function getVehicleMeta(vehicleType: string) {
  return api
    .get<VehicleMeta>('/vehicles/meta', {
      params: {
        type: vehicleType,
      },
    })
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(getApiErrorMessage(error))
    })
}

export function checkAvailability(request: AvailabilityRequest) {
  return api
    .post<AvailabilityResult>('/reservations/availability', request)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(getApiErrorMessage(error))
    })
}

export function createReservation(request: CreateReservationRequest) {
  return api
    .post<ReservationResult>('/reservations', request)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(getApiErrorMessage(error))
    })
}
