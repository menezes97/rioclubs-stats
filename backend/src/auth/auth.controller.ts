import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { loginSchema, type LoginDto } from './dto/login.schema.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica e retorna um token JWT' })
  async login(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }
}
