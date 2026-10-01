import { Controller, Get, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { PartidasService } from './partidas.service.js';
import { partidasQuerySchema, type PartidasQuery } from './dto/partidas-query.schema.js';

@Controller('partidas')
export class PartidasController {
  constructor(private readonly partidasService: PartidasService) {}

  @Get()
  async listar(@Query(new ZodValidationPipe(partidasQuerySchema)) query: PartidasQuery) {
    return this.partidasService.listar(query);
  }
}
