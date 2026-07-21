import { useForm } from 'react-hook-form'
import type { ReservationResult } from '../lib/bookingTypes'
import { formatDateTime } from '../lib/formatters'

export type BookingFormValues = {
  customerName: string
  customerEmail: string
  customerPhone: string
}

type BookingProps = {
  reservation: ReservationResult | null
  error: string
  canBook: boolean
  requestState: 'idle' | 'checking' | 'booking'
  onBookReservation: (values: BookingFormValues) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^\+?[0-9\s().-]{7,20}$/

export function Booking({
  reservation,
  error,
  canBook,
  requestState,
  onBookReservation,
}: BookingProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    mode: 'onTouched',
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    },
  })

  function submitBooking(values: BookingFormValues) {
    onBookReservation({
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail.trim(),
      customerPhone: values.customerPhone.trim(),
    })
  }

  return (
    <form
      className="booking-panel"
      aria-live="polite"
      onSubmit={handleSubmit(submitBooking)}
    >
      <div className="summary-header">
        <h4 className="eyebrow">Fill Booking Details</h4>
      </div>

      <div className="customer-fields">
        <label className="field">
          <span>Name</span>
          <input
            autoComplete="name"
            aria-invalid={Boolean(errors.customerName)}
            aria-describedby={errors.customerName ? 'customer-name-error' : undefined}
            {...register('customerName', {
              validate: (value) => {
                const trimmedValue = value.trim()

                if (!trimmedValue) {
                  return 'Name is required.'
                }

                if (trimmedValue.length < 2) {
                  return 'Name must be at least 2 characters.'
                }

                return true
              },
            })}
          />
          {errors.customerName?.message ? (
            <small className="field-error" id="customer-name-error">
              {errors.customerName.message}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            aria-invalid={Boolean(errors.customerEmail)}
            aria-describedby={
              errors.customerEmail ? 'customer-email-error' : undefined
            }
            type="email"
            {...register('customerEmail', {
              validate: (value) => {
                const trimmedValue = value.trim()

                if (!trimmedValue) {
                  return 'Email is required.'
                }

                if (!EMAIL_PATTERN.test(trimmedValue)) {
                  return 'Enter a valid email address.'
                }

                return true
              },
            })}
          />
          {errors.customerEmail?.message ? (
            <small className="field-error" id="customer-email-error">
              {errors.customerEmail.message}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Phone</span>
          <input
            autoComplete="tel"
            aria-invalid={Boolean(errors.customerPhone)}
            aria-describedby={
              errors.customerPhone ? 'customer-phone-error' : undefined
            }
            inputMode="tel"
            type="tel"
            {...register('customerPhone', {
              validate: (value) => {
                const trimmedValue = value.trim()
                const phoneDigits = trimmedValue.replace(/\D/g, '')

                if (!trimmedValue) {
                  return 'Phone is required.'
                }

                if (
                  !PHONE_PATTERN.test(trimmedValue) ||
                  phoneDigits.length < 7 ||
                  phoneDigits.length > 15
                ) {
                  return 'Enter a valid phone number.'
                }

                return true
              },
            })}
          />
          {errors.customerPhone?.message ? (
            <small className="field-error" id="customer-phone-error">
              {errors.customerPhone.message}
            </small>
          ) : null}
        </label>
      </div>

      <button
        className="primary-action secondary"
        type="submit"
        disabled={!canBook}
      >
        {requestState === 'booking' ? 'Booking...' : 'Book test drive'}
      </button>

      {reservation ? (
        <div className="confirmation">
          <strong>Reservation #{reservation.id} Confirmed</strong>
          <span>At {formatDateTime(reservation.startDateTime)}, Vehicle Id: {reservation.vehicleId}</span>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}
