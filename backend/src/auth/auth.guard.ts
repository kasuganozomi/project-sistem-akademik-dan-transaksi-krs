import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY, RoleName } from './roles.decorator';
import { verifyToken } from './jwt.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: unknown;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token tidak ditemukan.',
      });
    }

    try {
      const token = authorization.slice('Bearer '.length);
      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_secret';
      const user = verifyToken(token, secret);
      const roles =
        this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]) ?? [];

      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Role tidak memiliki akses.',
        });
      }

      request.user = user;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Token tidak valid.',
      });
    }
  }
}
