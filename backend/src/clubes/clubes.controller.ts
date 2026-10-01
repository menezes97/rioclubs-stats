import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ClubesService } from './clubes.service.js';
import { compararQuerySchema, type CompararQuery } from './dto/clube.schema.js';

@Controller('clubes')
export class ClubesController {
  constructor(private readonly clubesService: ClubesService) {}

  @Get()
  async listar() {
    return this.clubesService.listar();
  }

  @Get('classificacao')
  async classificacao() {
    return this.clubesService.classificacao();
  }

  @Get('compare')
  async comparar(@Query(new ZodValidationPipe(compararQuerySchema)) query: CompararQuery) {
    return this.clubesService.compararCabecaACabeca(query.a, query.b);
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.clubesService.buscarPorId(id);
  }

  @Get(':id/estatisticas')
  async estatisticas(@Param('id', ParseIntPipe) id: number) {
    return this.clubesService.estatisticasTemporada(id);
  }
}
