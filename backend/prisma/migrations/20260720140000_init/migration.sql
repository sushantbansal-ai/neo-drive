-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "availableFromTime" TEXT NOT NULL,
    "availableToTime" TEXT NOT NULL,
    "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minimumMinutesBetweenBookings" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDateTime" TIMESTAMPTZ(3) NOT NULL,
    "endDateTime" TIMESTAMPTZ(3) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vehicle_type_location_idx" ON "Vehicle"("type", "location");

-- CreateIndex
CREATE INDEX "Reservation_vehicleId_startDateTime_endDateTime_idx" ON "Reservation"("vehicleId", "startDateTime", "endDateTime");

-- CreateIndex
CREATE INDEX "Reservation_startDateTime_endDateTime_idx" ON "Reservation"("startDateTime", "endDateTime");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
