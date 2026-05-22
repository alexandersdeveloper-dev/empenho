import { Module } from '@nestjs/common';
import { ClassificacaoController } from './classificacao.controller';
import { ClassificacaoService } from './classificacao.service';

@Module({
  controllers: [ClassificacaoController],
  providers: [ClassificacaoService],
  exports: [ClassificacaoService],
})
export class ClassificacaoModule {}
