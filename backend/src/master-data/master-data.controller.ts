import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { MasterDataService } from './master-data.service';

@Controller()
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('tahun-ajaran')
  @Roles('ADMIN')
  listTahunAjaran() {
    return this.masterDataService.listTahunAjaran();
  }

  @Get('mata-kuliah')
  @Roles('ADMIN')
  listMataKuliah() {
    return this.masterDataService.listMataKuliah();
  }

  @Get('jadwal')
  @Roles('ADMIN')
  listJadwal() {
    return this.masterDataService.listJadwal();
  }

  @Get('dosen')
  @Roles('ADMIN')
  listDosen() {
    return this.masterDataService.listDosen();
  }

  @Get('mahasiswa')
  @Roles('ADMIN')
  listMahasiswa() {
    return this.masterDataService.listMahasiswa();
  }

  @Get('kelas')
  @Roles('ADMIN', 'MAHASISWA')
  listKelasAktif() {
    return this.masterDataService.listKelasAktif();
  }
}
