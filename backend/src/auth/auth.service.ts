import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    // Mensagem genérica de propósito — não revela se o problema foi o e-mail ou a senha.
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = await this.jwtService.signAsync({ sub: usuario.id, email: usuario.email });
    return { accessToken: token };
  }
}
