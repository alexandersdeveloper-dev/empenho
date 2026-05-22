import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  listar(
    @Query('tabela') tabela?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('operacao') operacao?: string,
    @Query('de') de?: string,
    @Query('ate') ate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.listar({
      tabela,
      usuario_id,
      operacao,
      de,
      ate,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
