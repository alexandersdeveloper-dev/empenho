import { Module } from '@nestjs/common';
import { EmpenhosController } from './empenhos.controller';
import { EmpenhosService } from './empenhos.service';

@Module({
  controllers: [EmpenhosController],
  providers: [EmpenhosService],
  exports: [EmpenhosService],
})
export class EmpenhosModule {}
