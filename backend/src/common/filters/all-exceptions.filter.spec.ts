import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function criarHostFalso(request: { method: string; url: string }) {
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, send };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('achata a mensagem de uma HttpException, sem aninhar o objeto { message, error, statusCode } do Nest', () => {
    const { host, status, send } = criarHostFalso({ method: 'GET', url: '/clubes/9999' });

    filter.catch(new NotFoundException('Clube 9999 não encontrado'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Clube 9999 não encontrado', // não { message: '...', error: 'Not Found', statusCode: 404 }
        path: '/clubes/9999',
      }),
    );
  });

  it('converte um erro desconhecido (não HttpException) em 500 genérico, sem vazar detalhe interno', () => {
    const { host, status, send } = criarHostFalso({ method: 'GET', url: '/clubes' });

    filter.catch(new Error('falha de conexão com o banco, segredo interno'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Erro interno do servidor' }),
    );
  });
});
