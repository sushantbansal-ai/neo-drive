import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { getVehicleMeta } from '../lib/api'
import type {
  AvailabilityResult,
  VehicleAvailabilityRule,
} from '../lib/bookingTypes'
import {
  formatUtcTimeForLocalInputDate,
  getMaxBookingDateTime,
  toLocalInputValue,
  nearestRoundInterval,
} from '../lib/dateTime'
import { capitalizeFirstLetter } from '../lib/formatters'

export type AvailabilityFormValues = {
  location: string
  startDateTime: string
  durationMins: number
}

type CheckAvailabilityProps = {
  vehicleType: string
  requestState: 'idle' | 'checking' | 'booking'
  availability: AvailabilityResult | null
  onSubmit: (values: AvailabilityFormValues) => void
  onFormChange: () => void
  onVehicleUnavailable: () => void
}

export function CheckAvailability({
  vehicleType,
  requestState,
  onSubmit,
  onFormChange,
  onVehicleUnavailable,
  availability,
}: CheckAvailabilityProps) {
  const [locations, setLocations] = useState<string[]>([])
  const [availabilityRules, setAvailabilityRules] = useState<
    VehicleAvailabilityRule[]
  >([])
  const [metaLoaded, setMetaLoaded] = useState(false)
  const firstLocation = locations[0] ?? ''
  const minDateTime = useMemo(() => toLocalInputValue(new Date()), [])
  const maxDateTime = useMemo(() => getMaxBookingDateTime(14), [])
  const defaultDateTime = useMemo(() => toLocalInputValue(nearestRoundInterval(new Date())), [])
    

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AvailabilityFormValues>({
    mode: 'onTouched',
    defaultValues: {
      location: firstLocation,
      startDateTime: defaultDateTime,
      durationMins: 30,
    },
  })

  useEffect(() => {

    async function loadMeta() {
      setMetaLoaded(false)

      try {
        const meta = await getVehicleMeta(vehicleType)

        setLocations(meta.locations)
        setAvailabilityRules(meta.availabilityRules)

        if (meta.locations.length === 0) {
          onVehicleUnavailable()
        }
      } catch {
        setLocations([])
        setAvailabilityRules([])
        onVehicleUnavailable()
      } finally {
        setMetaLoaded(true)
      }
    }

    loadMeta()

  }, [onVehicleUnavailable, vehicleType])

  const selectedLocation = useWatch({ control, name: 'location' })
  const selectedStartDateTime = useWatch({ control, name: 'startDateTime' })
  const selectedAvailabilityRule = useMemo(() => {
    return availabilityRules.find((rule) => rule.location === selectedLocation)
  }, [availabilityRules, selectedLocation])

  useEffect(() => {
    reset({
      location: firstLocation,
      startDateTime: defaultDateTime,
      durationMins: 30,
    })
  }, [firstLocation, defaultDateTime, reset])

  function submitAvailability(values: AvailabilityFormValues) {
    if (locations.length === 0) {
      onVehicleUnavailable()
      return
    }

    onSubmit({
      location: values.location,
      startDateTime: values.startDateTime,
      durationMins: Number(values.durationMins),
    })
  }

  function changeLocation(nextLocation: string) {
    setValue('location', nextLocation, { shouldValidate: true })
    onFormChange()
  }

  return (
    <form className="booking-panel" onSubmit={handleSubmit(submitAvailability)}>
      <div className="field-grid">
        <label className="field">
          <span>Location</span>
          <select
            aria-invalid={Boolean(errors.location)}
            aria-describedby={
              errors.location ? 'availability-location-error' : undefined
            }
            {...register('location', {
              validate: (value) => {
                if (locations.length === 0) {
                  return 'Vehicle not available.'
                }

                if (!value) {
                  return 'Location is required.'
                }

                return true
              },
              onChange: (event) => changeLocation(event.target.value),
            })}
          >
            {locations.map((option) => (
              <option key={option} value={option}>
                {capitalizeFirstLetter(option)}
              </option>
            ))}
          </select>
          {errors.location?.message ? (
            <small className="field-error" id="availability-location-error">
              {errors.location.message}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Date and time</span>
          <input
            type="datetime-local"
            min={minDateTime}
            max={maxDateTime}
            aria-invalid={Boolean(errors.startDateTime)}
            aria-describedby={
              errors.startDateTime
                ? 'availability-start-date-time-error'
                : undefined
            }
            {...register('startDateTime', {
              validate: (value) => {
                if (!value) {
                  return 'Date and time is required.'
                }

                if (value < minDateTime) {
                  return 'Choose a future date and time.'
                }

                if (value > maxDateTime) {
                  return 'Choose a date within the booking window.'
                }

                return true
              },
              onChange: onFormChange,
            })}
          />
          {errors.startDateTime?.message ? (
            <small
              className="field-error"
              id="availability-start-date-time-error"
            >
              {errors.startDateTime.message}
            </small>
          ) : null}
          {selectedAvailabilityRule ? (
            <small>
              {'Available from '}
              {formatUtcTimeForLocalInputDate(
                selectedAvailabilityRule.availableFromTime,
                selectedStartDateTime,
              )}{' '}
              to{' '}
              {formatUtcTimeForLocalInputDate(
                selectedAvailabilityRule.availableToTime,
                selectedStartDateTime,
              )}
              {' '}
              <small className="availability-days">
                {selectedAvailabilityRule.availableDays.join(', ')}
              </small>
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Duration</span>
          <select
            aria-invalid={Boolean(errors.durationMins)}
            aria-describedby={
              errors.durationMins ? 'availability-duration-error' : undefined
            }
            {...register('durationMins', {
              valueAsNumber: true,
              validate: (value) => {
                if (!value) {
                  return 'Duration is required.'
                }

                if (![30, 45, 60, 90].includes(value)) {
                  return 'Choose a valid duration.'
                }

                return true
              },
              onChange: onFormChange,
            })}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
          {errors.durationMins?.message ? (
            <small className="field-error" id="availability-duration-error">
              {errors.durationMins.message}
            </small>
          ) : null}
        </label>
      </div>

      <button
        className="primary-action"
        type="submit"
        disabled={requestState !== 'idle' || !metaLoaded}
      >
        {!metaLoaded
          ? 'Loading...'
          : requestState === 'checking'
            ? 'Checking...'
            : 'Check availability'}
      </button>
      {availability && (
        <div className={availability.available ? 'confirmation' : 'status-block warning'}>
          <strong>{availability.available ? 'Slot Available!' : 'No availability'}</strong>
          <span>{availability.available ? 'Please fill the booking details.' : 'Try another slot or location.'}</span>
        </div>
      )}
    </form>
  )
}
