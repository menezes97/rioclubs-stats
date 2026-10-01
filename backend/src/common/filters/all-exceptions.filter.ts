import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

/** Nest normaliza o corpo de uma HttpException em `{ message, error, statusCode }` quando você
 * passa uma string/array pro construtor — aqui extraímos só o `message` real, pra não aninhar
 * esse objeto inteiro dentro do nosso próprio campo `message`. */
function extrairMensagem(exception: HttpException): unknown {
  const resposta = exception.getResponse();
  if (typeof resposta === 'string') return resposta;
  if (resposta && typeof resposta === 'object' && 'message' in resposta) {
    return (resposta as { message: unknown }).message;
  }
  return resposta;
}

/**
 * Captura toda exceção lançada por qualquer controller e devolve um formato de erro
 * consistente, independente de ser uma HttpException conhecida (404, 400, 401...) ou
 * um erro inesperado (que vira 500, sem vazar detalhes internos pro cliente).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? extrairMensagem(exception) : 'Erro interno do servidor';

    if (!isHttpException) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`Exceção não tratada em ${request.method} ${request.url}`, stack);
    }

    response.status(status).send({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
