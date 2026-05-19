import { Body, Controller, Post } from '@nestjs/common';
import { apiError } from '../common/api-error';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

interface LoginBody {
  username?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() body: LoginBody) {
    if (!body.username || !body.password) {
      throw apiError('VALIDATION_ERROR', 'Username dan password wajib diisi.');
    }

    return this.authService.login(body.username, body.password);
  }
}
