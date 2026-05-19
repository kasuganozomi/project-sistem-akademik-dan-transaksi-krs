import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { signToken } from './jwt.util';
import { verifyPassword } from './password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        mahasiswa: true,
        dosen: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Username atau password salah.',
      });
    }

    const secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_secret';
    const accessToken = signToken(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
    );

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mahasiswaId: user.mahasiswa?.id ?? null,
        dosenId: user.dosen?.id ?? null,
        nama: user.mahasiswa?.nama ?? user.dosen?.nama ?? user.username,
      },
    };
  }
}
