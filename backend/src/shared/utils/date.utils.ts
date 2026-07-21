import moment from 'moment';

export function addMinutes(date: Date, minutes: number): Date {
  return moment.utc(date).add(minutes, 'minutes').toDate();
}

export function subtractMinutes(date: Date, minutes: number): Date {
  return moment.utc(date).subtract(minutes, 'minutes').toDate();
}

export function isValidDate(date: Date): boolean {
  return moment.utc(date).isValid();
}

export function toUtcTime(date: Date): string {
  return moment.utc(date).format('HH:mm:ss');
}
