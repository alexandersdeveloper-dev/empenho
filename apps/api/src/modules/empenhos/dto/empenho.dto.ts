import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DescontoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() tipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigo?: string;
  @IsNumber() @Min(0) valor: number = 0;
  @ApiPropertyOptional() @IsOptional() @IsString() efd_codigo?: string;
  @IsInt() ord: number = 0;
}

export class ParcelaDto {
  @IsNumber() @Min(0) valor: number = 0;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() forma_pagamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() conta?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numero_op?: string;
  @IsInt() ord: number = 0;
}

export class LiquidacaoDto {
  @IsNumber() @Min(0) valor: number = 0;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data_liquidacao?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data_pagamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numero_op?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() forma_pagamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() conta?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParcelaDto)
  parcelas: ParcelaDto[] = [];
}

export class CreateEmpenhoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() numero_ficha?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projeto_atividade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dotacao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subelemento_codigo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subelemento_descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() credor_id?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() credor_numero?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() credor_nome?: string;

  @ApiProperty({ enum: [1, 2, 3] })
  @IsIn([1, 2, 3])
  tipo_empenho: 1 | 2 | 3 = 1;

  @ApiPropertyOptional() @IsOptional() @IsString() historico?: string;
  @IsNumber() @Min(0) valor_empenho: number = 0;
  @ApiPropertyOptional() @IsOptional() @IsInt() emenda?: number;

  @ApiProperty({ enum: [1, 2] })
  @IsIn([1, 2])
  exercicio: 1 | 2 = 1;

  @ApiPropertyOptional() @IsOptional() @IsString() numero_contrato?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numero_convenio?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data_empenho?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() departamento_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescontoDto)
  descontos: DescontoDto[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LiquidacaoDto)
  liquidacao?: LiquidacaoDto;
}

export class UpdateEmpenhoDto extends CreateEmpenhoDto {}

export class EmpenhoFiltrosDto {
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interno?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) tipo?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() de?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() ate?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) departamento_id?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) page: number = 1;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) limit: number = 50;
}
