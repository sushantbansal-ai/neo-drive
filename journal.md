# Nevo Test Drive Service Journal

## Backend Design

The backend separates booking concerns into focused services:

- `BookingPolicyService` validates booking windows, future booking limits, vehicle days, and vehicle hours.
- `BookingConflictService` checks reservation overlap and minimum buffer rules.
- `BookingDistributionService` selects the best vehicle using reservation stats.
- `BookingService` coordinates availability checks, reservation creation, locking, and persistence.

The main API endpoints are:

- `POST /reservations/availability`
- `POST /reservations`
- `GET /vehicles`
- `GET /vehicles/meta`
- `GET /vehicles/:id`

## Distribution Strategy

The distribution algorithm uses a `VehicleReservationStats` table instead of scanning the full reservation history on every selection. For candidate vehicles, it prefers:

1. The lowest `reservationCount`.
2. The earliest `lastReservationEndDateTime`.

Vehicles without stats are treated as unused, which keeps newly added vehicles eligible without requiring a separate backfill before they can be selected.


## Frontend Notes

The frontend provides a configurable booking component. The vehicle type can be supplied through the URL query string:

```text
http://localhost:5173?type=tesla_modelx
```

## Hosting Approach

For a production deployment, I would split the system into:

- Frontend: static Vite build hosted on S3 + CloudFront.
- Backend: containerized NestJS API on ECS container platform.
- Database: RDS Postgres.

For AWS specifically, ECS Fargate plus RDS Postgres is the most direct fit. It keeps the backend stateless, lets the database handle transactional consistency, and gives a straightforward path for autoscaling, logs, secrets, backups, and zero-downtime deploys.