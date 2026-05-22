import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubelementosService } from './subelementos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('subelementos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subelementos')
export class SubelementosController {
  constructor(private readonly service: SubelementosService) {}

  @Get()
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscarPorNatureza(@Query('natureza') natureza: string) {
    return this.service.buscarPorNatureza(natureza);
  }

  @Get('efd')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscarEfd(@Query('q') q?: string) {
    return this.service.buscarEfd(q);
  }
}
