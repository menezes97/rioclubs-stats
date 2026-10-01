import { Module } from '@nestjs/common';
import { ClubesController } from './clubes.controller.js';
import { ClubesService } from './clubes.service.js';

@Module({
  controllers: [ClubesController],
  providers: [ClubesService],
})
export class ClubesModule {}
