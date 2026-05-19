import { BadRequestException } from '@nestjs/common';

export function apiError(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}
