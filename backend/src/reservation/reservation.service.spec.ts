jest.mock('../booking/booking.service', () => ({
  BookingService: class BookingService {},
}));

import { ReservationService } from './reservation.service';

describe('ReservationService', () => {
  const bookingService = {
    findAvailability: jest.fn(),
    bookReservation: jest.fn(),
  };

  let service: ReservationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReservationService(bookingService as never);
  });

  it('delegates availability checks to the booking service', async () => {
    const request = {
      location: 'dublin',
      vehicleType: 'tesla_model3',
      startDateTime: '2026-07-21T09:00:00Z',
      durationMins: 45,
    };
    const response = {
      available: true,
      vehicle: null,
      startDateTime: '2026-07-21T09:00:00.000Z',
      endDateTime: '2026-07-21T09:45:00.000Z',
    };

    bookingService.findAvailability.mockResolvedValue(response);

    await expect(service.checkAvailability(request)).resolves.toEqual(response);
    expect(bookingService.findAvailability).toHaveBeenCalledWith(request);
  });

  it('delegates reservation creation to the booking service', async () => {
    const request = {
      vehicleId: 'tesla_1001',
      startDateTime: '2026-07-21T09:00:00Z',
      durationMins: 45,
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerPhone: '+353851234567',
    };
    const response = {
      id: 1,
      vehicleId: 'tesla_1001',
      startDateTime: '2026-07-21T09:00:00.000Z',
      endDateTime: '2026-07-21T09:45:00.000Z',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerPhone: '+353851234567',
    };

    bookingService.bookReservation.mockResolvedValue(response);

    await expect(service.createReservation(request)).resolves.toEqual(response);
    expect(bookingService.bookReservation).toHaveBeenCalledWith(request);
  });
});
