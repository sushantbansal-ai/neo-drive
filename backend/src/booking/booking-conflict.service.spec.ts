import { BookingConflictService } from './booking-conflict.service';

describe('BookingConflictService', () => {
  const service = new BookingConflictService();

  const reservations = [
    {
      vehicleId: 'tesla_1001',
      startDateTime: new Date('2026-07-21T09:00:00Z'),
      endDateTime: new Date('2026-07-21T09:45:00Z'),
    },
  ];

  it('detects reservation conflicts including the required buffer', () => {
    expect(
      service.hasConflict(
        reservations,
        {
          startDateTime: new Date('2026-07-21T09:59:00Z'),
          endDateTime: new Date('2026-07-21T10:44:00Z'),
        },
        15,
      ),
    ).toBe(true);
  });

  it('allows reservations exactly after the required buffer', () => {
    expect(
      service.hasConflict(
        reservations,
        {
          startDateTime: new Date('2026-07-21T10:00:00Z'),
          endDateTime: new Date('2026-07-21T10:45:00Z'),
        },
        15,
      ),
    ).toBe(false);
  });
});
