import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ConfigAppService } from './config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class UpdateQrDto {
  @IsString() campos: string;
  @IsString() separador: string;
}

class UpdateObrigDto {
  @IsString() campos: string;
}

@ApiTags('config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('config')
export class ConfigAppController {
  constructor(private readonly service: ConfigAppService) {}

  @Get('qr')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  getQr() {
    return this.service.getConfigQr();
  }

  @Patch('qr')
  @Roles('superadmin', 'admin')
  updateQr(@Body() dto: UpdateQrDto) {
    return this.service.updateConfigQr(dto.campos, dto.separador);
  }

  @Get('obrigatorios')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  getObrigatorios() {
    return this.service.getCamposObrigatorios();
  }

  @Patch('obrigatorios')
  @Roles('superadmin', 'admin')
  updateObrigatorios(@Body() dto: UpdateObrigDto) {
    return this.service.updateCamposObrigatorios(dto.campos);
  }

  @Get('formas-pagamento')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  getFormasPagamento() {
    return this.service.getFormasPagamento();
  }

  @Get('retencoes')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  getRetencoes(@Query('q') q?: string) {
    return this.service.getRetencoes(q);
  }
}
