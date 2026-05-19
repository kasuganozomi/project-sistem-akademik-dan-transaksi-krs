import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthTokenPayload } from '../auth/jwt.util';
import { Roles } from '../auth/roles.decorator';
import { KrsService } from './krs.service';

@Controller('krs')
export class KrsController {
  constructor(private readonly krsService: KrsService) {}

  @Get('me')
  @Roles('MAHASISWA')
  getMyKrs(@CurrentUser() user: AuthTokenPayload) {
    return this.krsService.getMyKrs(user.sub);
  }

  @Post('me/items')
  @Roles('MAHASISWA')
  addItem(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: { kelasId?: string },
  ) {
    return this.krsService.addItem(user.sub, body.kelasId ?? '');
  }

  @Delete('me/items/:ambilKrsId')
  @Roles('MAHASISWA')
  removeItem(
    @CurrentUser() user: AuthTokenPayload,
    @Param('ambilKrsId') ambilKrsId: string,
  ) {
    return this.krsService.removeItem(user.sub, ambilKrsId);
  }

  @Post('me/submit')
  @Roles('MAHASISWA')
  submit(@CurrentUser() user: AuthTokenPayload) {
    return this.krsService.submit(user.sub);
  }

  @Get('approval')
  @Roles('DOSEN')
  listApproval(@CurrentUser() user: AuthTokenPayload) {
    return this.krsService.listApproval(user.sub);
  }

  @Post(':id/approve')
  @Roles('DOSEN')
  approve(@CurrentUser() user: AuthTokenPayload, @Param('id') id: string) {
    return this.krsService.approve(user.sub, id);
  }

  @Post(':id/reject')
  @Roles('DOSEN')
  reject(
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') id: string,
    @Body() body: { catatanDosen?: string },
  ) {
    return this.krsService.reject(user.sub, id, body.catatanDosen);
  }
}
