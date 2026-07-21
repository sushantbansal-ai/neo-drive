CREATE TABLE "VehicleReservationStats" (
    "vehicleId" TEXT NOT NULL,
    "reservationCount" INTEGER NOT NULL DEFAULT 0,
    "lastReservationEndDateTime" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleReservationStats_pkey" PRIMARY KEY ("vehicleId")
);

CREATE INDEX "VehicleReservationStats_reservationCount_lastReservationEnd_idx"
ON "VehicleReservationStats"("reservationCount", "lastReservationEndDateTime");

ALTER TABLE "VehicleReservationStats"
ADD CONSTRAINT "VehicleReservationStats_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "VehicleReservationStats" (
    "vehicleId",
    "reservationCount",
    "lastReservationEndDateTime",
    "updatedAt"
)
SELECT
    "vehicleId",
    COUNT(*)::INTEGER,
    MAX("endDateTime"),
    CURRENT_TIMESTAMP
FROM "Reservation"
GROUP BY "vehicleId";
