import { Module } from '@nestjs/common';
import { PartidasController } from './partidas.controller.js';
import { PartidasService } from './partidas.service.js';

@Module({
  controllers: [PartidasController],
  providers: [PartidasService],
})
export class PartidasModule {}
