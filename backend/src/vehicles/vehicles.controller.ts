import { Controller, Get, Param, Query } from '@nestjs/common';
import { VehicleMetaModel, VehicleModel } from '../shared/models/vehicle.model';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query() query: ListVehiclesQueryDto): Promise<VehicleModel[]> {
    return this.vehiclesService.findAll(query);
  }

  @Get('meta')
  getMeta(@Query() query: ListVehiclesQueryDto): Promise<VehicleMetaModel> {
    return this.vehiclesService.getMeta(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<VehicleModel> {
    return this.vehiclesService.findOne(id);
  }
}
