import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Loga método, caminho e tempo de resposta de toda requisição que chega na API. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const inicio = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duracaoMs = Date.now() - inicio;
        this.logger.log(`${method} ${url} — ${duracaoMs}ms`);
      }),
    );
  }
}
