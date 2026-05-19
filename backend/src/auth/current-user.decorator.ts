import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthTokenPayload } from './jwt.util';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthTokenPayload => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthTokenPayload }>();

    return request.user;
  },
);
