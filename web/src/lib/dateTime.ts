import { addDays, format, parseISO } from 'date-fns'

function padDatePart(value: number) {
  return value.toString().padStart(2, '0')
}

export function nearestRoundInterval(date: Date) {
  const minutes = date.getMinutes()
  const roundedMinutes = Math.ceil(minutes / 30) * 30
  const newDate = new Date(date)
  newDate.setMinutes(roundedMinutes)
  newDate.setSeconds(0)
  newDate.setMilliseconds(0)
  return newDate
}

export function toLocalInputValue(date: Date) {
  const localDate = [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-')
  const localTime = `${padDatePart(date.getHours())}:${padDatePart(
    date.getMinutes(),
  )}`

  return `${localDate}T${localTime}`
}

export function toIsoDateTime(localInputDateTime: string) {
  return parseISO(localInputDateTime).toISOString()
}

export function getMaxBookingDateTime(daysFromNow: number) {
  return toLocalInputValue(addDays(new Date(), daysFromNow))
}

function parseUtcTime(time: string) {
  const [hours = 0, minutes = 0, seconds = 0] = time
    .split(':')
    .map((part) => Number(part))

  return { hours, minutes, seconds }
}

export function formatUtcTimeForLocalInputDate(
  time: string,
  localInputDateTime: string,
) {
  const referenceDate = localInputDateTime
    ? new Date(localInputDateTime)
    : new Date()
  const { hours, minutes, seconds } = parseUtcTime(time)
  const localDateForUtcTime = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      hours,
      minutes,
      seconds,
      0,
    ),
  )

  return format(localDateForUtcTime, 'h:mm a')
}
