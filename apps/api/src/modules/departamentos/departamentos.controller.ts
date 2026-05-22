import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DepartamentosService } from './departamentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class CriarDepartamentoDto {
  @IsString() nome: string;
  @IsOptional() @IsString() sigla?: string;
}

@ApiTags('departamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly service: DepartamentosService) {}

  @Get()
  @Roles('superadmin', 'admin', 'user', 'viewer')
  listar() {
    return this.service.listar();
  }

  @Post()
  @Roles('superadmin', 'admin')
  criar(@Body() dto: CriarDepartamentoDto) {
    return this.service.criar(dto);
  }
}
