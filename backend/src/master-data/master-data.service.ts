import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  listTahunAjaran() {
    return this.prisma.tahunAjaran.findMany({
      orderBy: [{ tahun: 'desc' }, { semester: 'asc' }],
    });
  }

  listMataKuliah() {
    return this.prisma.mataKuliah.findMany({
      orderBy: [{ semesterRekomendasi: 'asc' }, { kode: 'asc' }],
    });
  }

  listJadwal() {
    return this.prisma.jadwal.findMany({
      orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }],
    });
  }

  listDosen() {
    return this.prisma.dosen.findMany({
      orderBy: { nama: 'asc' },
      include: { user: { select: { username: true, role: true } } },
    });
  }

  listMahasiswa() {
    return this.prisma.mahasiswa.findMany({
      orderBy: { nim: 'asc' },
      include: {
        dosenPa: { select: { id: true, nip: true, nama: true } },
        user: { select: { username: true, role: true } },
      },
    });
  }

  async listKelasAktif() {
    const tahunAktif = await this.prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    if (!tahunAktif) {
      return [];
    }

    const kelas = await this.prisma.kelas.findMany({
      where: { tahunAjaranId: tahunAktif.id },
      orderBy: [
        { mataKuliah: { semesterRekomendasi: 'asc' } },
        { mataKuliah: { kode: 'asc' } },
        { kodeKelas: 'asc' },
      ],
      include: {
        mataKuliah: true,
        dosen: true,
        jadwal: true,
        tahunAjaran: true,
        _count: { select: { ambilKrs: true } },
      },
    });

    return kelas.map((item) => ({
      ...item,
      terisi: item._count.ambilKrs,
      sisaKuota: item.kuota - item._count.ambilKrs,
      _count: undefined,
    }));
  }
}
