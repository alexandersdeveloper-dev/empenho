import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EmpenhosService } from './empenhos.service';
import { CreateEmpenhoDto, EmpenhoFiltrosDto, UpdateEmpenhoDto } from './dto/empenho.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Perfil } from '@ficha-empenho/shared';

@ApiTags('empenhos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Controller('empenhos')
export class EmpenhosController {
  constructor(private readonly service: EmpenhosService) {}

  @Get()
  @Roles('superadmin', 'admin', 'user', 'viewer')
  listar(@Query() filtros: EmpenhoFiltrosDto, @CurrentUser() user: Perfil) {
    return this.service.listar(filtros, user);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Perfil) {
    return this.service.buscarPorId(id, user);
  }

  @Post()
  @Roles('superadmin', 'admin', 'user')
  criar(@Body() dto: CreateEmpenhoDto, @CurrentUser() user: Perfil) {
    return this.service.criar(dto, user);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'user')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpenhoDto,
    @CurrentUser() user: Perfil,
  ) {
    return this.service.atualizar(id, dto, user);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin', 'user')
  excluir(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Perfil) {
    return this.service.excluir(id, user);
  }
}
