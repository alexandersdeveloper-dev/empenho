import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Perfil } from '@ficha-empenho/shared';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  me(@CurrentUser() user: Perfil) {
    return this.service.buscarPorId(user.id);
  }

  @Get()
  @Roles('superadmin', 'admin')
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  criar(
    @Body()
    dto: {
      nome: string;
      email: string;
      password: string;
      role: string;
      departamento_id?: number;
    },
  ) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { nome?: string; role?: string; departamento_id?: number; ativo?: boolean },
    @CurrentUser() user: Perfil,
  ) {
    return this.service.atualizar(id, dto, user);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  desativar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: Perfil) {
    return this.service.desativar(id, user);
  }
}
