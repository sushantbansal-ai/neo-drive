import { format } from 'date-fns'

export function formatDateTime(value: string) {
  return `${format(new Date(value), 'PP p')} local`
}

export function formatVehicleType(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export function capitalizeFirstLetter(value: string) {
  return value[0]?.toUpperCase() + value.slice(1)
}
