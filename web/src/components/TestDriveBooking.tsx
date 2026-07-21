import { useCallback, useState } from 'react'
import {
  checkAvailability as checkAvailabilityRequest,
  createReservation,
} from '../lib/api'
import type { AvailabilityResult, ReservationResult } from '../lib/bookingTypes'
import { toIsoDateTime } from '../lib/dateTime'
import { Booking } from './Booking'
import type { BookingFormValues } from './Booking'
import { CheckAvailability } from './CheckAvailability'
import type { AvailabilityFormValues } from './CheckAvailability'

type TestDriveBookingProps = {
  vehicleType: string
}

type RequestState = 'idle' | 'checking' | 'booking'

export function TestDriveBooking({ vehicleType }: TestDriveBookingProps) {
  const [checkedAvailabilityRequest, setCheckedAvailabilityRequest] =
    useState<AvailabilityFormValues | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(
    null,
  )
  const [reservation, setReservation] = useState<ReservationResult | null>(null)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState<RequestState>('idle')

  const selectedVehicleId = availability?.vehicle?.id

  const canBook = Boolean(
    availability?.available &&
    selectedVehicleId &&
    checkedAvailabilityRequest &&
    requestState === 'idle',
  )

  const resetOutcome = useCallback(() => {
    setAvailability(null)
    setReservation(null)
    setCheckedAvailabilityRequest(null)
    setError('')
  }, [])

  const checkAvailability = useCallback(async (values: AvailabilityFormValues) => {
    setRequestState('checking')
    setError('')
    setReservation(null)

    try {
      const result = await checkAvailabilityRequest({
        location: values.location,
        vehicleType,
        startDateTime: toIsoDateTime(values.startDateTime),
        durationMins: values.durationMins,
      })
      setAvailability(result)
      setCheckedAvailabilityRequest(values)
    } catch (error) {
      setAvailability(null)
      setCheckedAvailabilityRequest(null)
      setError(error instanceof Error ? error.message : 'Unable to check.')
    } finally {
      setRequestState('idle')
    }
  }, [vehicleType])

  const markVehicleUnavailable = useCallback(() => {
    setAvailability(null)
    setReservation(null)
    setCheckedAvailabilityRequest(null)
    setError('Vehicle not available')
  }, [])

  async function bookReservation(customerDetails: BookingFormValues) {
    if (!selectedVehicleId || !checkedAvailabilityRequest) {
      return
    }
    setReservation(null)
    setRequestState('booking')
    setError('')

    try {
      const result = await createReservation({
        vehicleId: selectedVehicleId,
        startDateTime: toIsoDateTime(checkedAvailabilityRequest.startDateTime),
        durationMins: checkedAvailabilityRequest.durationMins,
        customerName: customerDetails.customerName,
        customerEmail: customerDetails.customerEmail,
        customerPhone: customerDetails.customerPhone,
      })

      setReservation(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to book.')
    } finally {
      setRequestState('idle')
    }
  }


  return (
    <section className="booking-shell" aria-labelledby="booking-title">
      {error && !availability?.available ? (
        <div className="status-block">
          <p className="warning">{error}</p>
        </div>
      ) : null}
      <div className="booking-layout">

        <CheckAvailability
          vehicleType={vehicleType}
          requestState={requestState}
          onSubmit={checkAvailability}
          onFormChange={resetOutcome}
          onVehicleUnavailable={markVehicleUnavailable}
          availability={availability}
        />

        {availability?.available && (
          <Booking
            reservation={reservation}
            error={error}
            canBook={canBook}
            requestState={requestState}
            onBookReservation={bookReservation}
          />)}

      </div>
    </section>
  )
}
