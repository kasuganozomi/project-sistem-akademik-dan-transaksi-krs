import { SetMetadata } from '@nestjs/common';
import { AuthTokenPayload } from './jwt.util';

export const ROLES_KEY = 'roles';
export type RoleName = AuthTokenPayload['role'];

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
