import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  toVehicleModel,
  VehicleMetaModel,
  VehicleModel,
} from '../shared/models/vehicle.model';
import { uniqueSorted } from '../shared/utils/array.utils';
import { normalizeText } from '../shared/utils/string.utils';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListVehiclesQueryDto = {}): Promise<VehicleModel[]> {
    const location = normalizeText(query.location);
    const type = normalizeText(query.type);

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        ...(location ? { location } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: [{ location: 'asc' }, { type: 'asc' }, { id: 'asc' }],
    });

    return vehicles.map(toVehicleModel);
  }

  async findOne(id: string): Promise<VehicleModel> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} was not found.`);
    }

    return toVehicleModel(vehicle);
  }

  async getMeta(): Promise<VehicleMetaModel> {
    const vehicles = await this.prisma.vehicle.findMany({
      select: {
        location: true,
        type: true,
      },
      orderBy: [{ location: 'asc' }, { type: 'asc' }],
    });

    return {
      locations: uniqueSorted(vehicles.map((vehicle) => vehicle.location)),
      vehicleTypes: uniqueSorted(vehicles.map((vehicle) => vehicle.type)),
    };
  }
}
