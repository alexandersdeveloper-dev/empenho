import { Module } from '@nestjs/common';
import { CredoresController } from './credores.controller';
import { CredoresService } from './credores.service';

@Module({
  controllers: [CredoresController],
  providers: [CredoresService],
})
export class CredoresModule {}
