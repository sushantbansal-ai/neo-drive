import { BookingDistributionService } from './booking-distribution.service';

describe('BookingDistributionService', () => {
  const service = new BookingDistributionService();
  const vehicles = [
    {
      id: 'tesla_1001',
      type: 'tesla_model3',
      location: 'dublin',
      availableFromTime: '08:00:00',
      availableToTime: '18:00:00',
      availableDays: ['mon'],
      minimumMinutesBetweenBookings: 15,
    },
    {
      id: 'tesla_1002',
      type: 'tesla_model3',
      location: 'dublin',
      availableFromTime: '08:00:00',
      availableToTime: '18:00:00',
      availableDays: ['mon'],
      minimumMinutesBetweenBookings: 15,
    },
  ];

  it('selects the vehicle with the fewest reservations', () => {
    expect(
      service.selectVehicle(vehicles, [
        {
          vehicleId: 'tesla_1001',
          reservationCount: 3,
          lastReservationEndDateTime: new Date('2026-07-21T09:45:00Z'),
        },
        {
          vehicleId: 'tesla_1002',
          reservationCount: 1,
          lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
        },
      ]),
    ).toEqual(vehicles[1]);
  });

  it('uses last reservation time then id as deterministic tie breakers', () => {
    expect(
      service.selectVehicle(vehicles, [
        {
          vehicleId: 'tesla_1001',
          reservationCount: 1,
          lastReservationEndDateTime: new Date('2026-07-21T11:45:00Z'),
        },
        {
          vehicleId: 'tesla_1002',
          reservationCount: 1,
          lastReservationEndDateTime: new Date('2026-07-21T10:45:00Z'),
        },
      ]),
    ).toEqual(vehicles[1]);
  });
});
