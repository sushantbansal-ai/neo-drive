import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

type VehicleSeed = {
  id: string;
  type: string;
  location: string;
  availableFromTime: string;
  availableToTime: string;
  availableDays: string[];
  minimumMinutesBetweenBookings: number;
};

type ReservationSeed = {
  id: number;
  vehicleId: string;
  startDateTime: string;
  endDateTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

type VehiclesFile = {
  vehicles: VehicleSeed[];
};

type ReservationsFile = {
  reservations: ReservationSeed[];
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const dataDir = resolve(process.cwd(), '../data');

async function readJson<T>(fileName: string): Promise<T> {
  const file = await readFile(resolve(dataDir, fileName), 'utf8');
  return JSON.parse(file) as T;
}

async function seedVehicles(vehicles: VehicleSeed[]) {
  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      create: vehicle,
      update: vehicle,
    });
  }
}

async function seedReservations(reservations: ReservationSeed[]) {
  for (const reservation of reservations) {
    await prisma.reservation.upsert({
      where: { id: reservation.id },
      create: {
        id: reservation.id,
        vehicleId: reservation.vehicleId,
        startDateTime: new Date(reservation.startDateTime),
        endDateTime: new Date(reservation.endDateTime),
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
      },
      update: {
        vehicleId: reservation.vehicleId,
        startDateTime: new Date(reservation.startDateTime),
        endDateTime: new Date(reservation.endDateTime),
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
      },
    });
  }
}

async function main() {
  const [{ vehicles }, { reservations }] = await Promise.all([
    readJson<VehiclesFile>('vehicles.json'),
    readJson<ReservationsFile>('reservations.json'),
  ]);

  await seedVehicles(vehicles);
  await seedReservations(reservations);

  console.log(
    `Seeded ${vehicles.length} vehicles and ${reservations.length} reservations.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
