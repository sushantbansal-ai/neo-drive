import { IsOptional, IsString } from 'class-validator';

export class ListVehiclesQueryDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
