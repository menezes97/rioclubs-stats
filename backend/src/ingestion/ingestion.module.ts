import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IngestionController } from './ingestion.controller.js';
import { IngestionService } from './ingestion.service.js';
import { FootballApiService } from './football-api.service.js';

@Module({
  imports: [HttpModule],
  controllers: [IngestionController],
  providers: [IngestionService, FootballApiService],
})
export class IngestionModule {}
