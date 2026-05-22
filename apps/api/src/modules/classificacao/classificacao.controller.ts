import { Controller, Delete, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassificacaoService } from './classificacao.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('classificacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classificacao')
export class ClassificacaoController {
  constructor(private readonly service: ClassificacaoService) {}

  @Get()
  @Roles('superadmin', 'admin', 'user', 'viewer')
  listar(@Query('q') q?: string) {
    return this.service.listar(q);
  }

  @Get('ficha/:numeroFicha')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscarPorFicha(@Param('numeroFicha') ficha: string) {
    return this.service.buscarPorFicha(ficha);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  excluir(@Param('id', ParseIntPipe) id: number) {
    return this.service.excluir(id);
  }
}
