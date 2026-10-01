import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const schema = z.object({ a: z.coerce.number().int().positive(), b: z.coerce.number().int().positive() });
  const pipe = new ZodValidationPipe(schema);

  it('retorna o valor convertido quando é válido', () => {
    expect(pipe.transform({ a: '1', b: '2' })).toEqual({ a: 1, b: 2 });
  });

  it('lança BadRequestException quando é inválido', () => {
    expect(() => pipe.transform({ a: 'abc', b: '2' })).toThrow(BadRequestException);
  });

  it('o corpo da exceção traz campo e mensagem por erro', () => {
    try {
      pipe.transform({ a: 'abc', b: '2' });
      expect.unreachable();
    } catch (erro) {
      expect(erro).toBeInstanceOf(BadRequestException);
      // o Nest embrulha o array passado ao construtor em { message, error, statusCode }
      const resposta = (erro as BadRequestException).getResponse() as {
        message: Array<{ campo: string; mensagem: string }>;
      };
      expect(resposta.message[0].campo).toBe('a');
      expect(resposta.message[0].mensagem).toBeTruthy();
    }
  });
});
