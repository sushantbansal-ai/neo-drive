import { BadRequestException } from '@nestjs/common';
import { BookingPolicyService } from './booking-policy.service';

describe('BookingPolicyService', () => {
  const service = new BookingPolicyService();

  it('creates an end datetime from start datetime and duration', () => {
    expect(
      service.createWindow('2026-07-21T09:00:00Z', 45),
    ).toEqual({
      startDateTime: new Date('2026-07-21T09:00:00Z'),
      endDateTime: new Date('2026-07-21T09:45:00Z'),
    });
  });

  it('rejects non-positive durations', () => {
    expect(() =>
      service.createWindow('2026-07-21T09:00:00Z', 0),
    ).toThrow(BadRequestException);
  });

  it('rejects bookings outside the 14 day horizon', () => {
    expect(() =>
      service.bookingValidation(
        new Date('2026-08-05T09:00:00Z'),
        new Date('2026-07-20T09:00:00Z'),
      ),
    ).toThrow(BadRequestException);
  });

  it('checks vehicle availability by UTC day and operating hours', () => {
    expect(
      service.isVehicleAvailableForWindow(
        {
          id: 'tesla_1001',
          type: 'tesla_model3',
          location: 'dublin',
          availableFromTime: '08:00:00',
          availableToTime: '18:00:00',
          availableDays: ['tue'],
          minimumMinutesBetweenBookings: 15,
        },
        {
          startDateTime: new Date('2026-07-21T09:00:00Z'),
          endDateTime: new Date('2026-07-21T09:45:00Z'),
        },
      ),
    ).toBe(true);
  });
});
