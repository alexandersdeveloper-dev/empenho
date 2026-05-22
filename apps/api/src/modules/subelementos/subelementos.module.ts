import { Module } from '@nestjs/common';
import { SubelementosController } from './subelementos.controller';
import { SubelementosService } from './subelementos.service';

@Module({
  controllers: [SubelementosController],
  providers: [SubelementosService],
  exports: [SubelementosService],
})
export class SubelementosModule {}
