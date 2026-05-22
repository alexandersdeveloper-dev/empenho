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
import { IsOptional, IsString } from 'class-validator';
import { CredoresService } from './credores.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class CredorDto {
  @IsOptional() @IsString() numero?: string;
  @IsString() nome: string;
}

class BuscaDto {
  @IsOptional() @IsString() q?: string;
}

@ApiTags('credores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('credores')
export class CredoresController {
  constructor(private readonly service: CredoresService) {}

  @Get()
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscar(@Query() dto: BuscaDto) {
    return this.service.buscar(dto.q);
  }

  @Get('numero/:numero')
  @Roles('superadmin', 'admin', 'user', 'viewer')
  buscarPorNumero(@Param('numero') numero: string) {
    return this.service.buscarPorNumero(numero);
  }

  @Post()
  @Roles('superadmin', 'admin')
  criar(@Body() dto: CredorDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CredorDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  excluir(@Param('id', ParseIntPipe) id: number) {
    return this.service.excluir(id);
  }
}
