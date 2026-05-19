import { Injectable, NotFoundException } from '@nestjs/common';
import { apiError } from '../common/api-error';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KrsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyKrs(userId: string) {
    const mahasiswa = await this.getMahasiswaByUserId(userId);
    const tahunAktif = await this.getTahunAktif();
    const krs = await this.prisma.krs.upsert({
      where: {
        mahasiswaId_tahunAjaranId: {
          mahasiswaId: mahasiswa.id,
          tahunAjaranId: tahunAktif.id,
        },
      },
      update: {},
      create: {
        mahasiswaId: mahasiswa.id,
        tahunAjaranId: tahunAktif.id,
      },
      include: this.krsInclude(),
    });

    return this.mapKrs(krs);
  }

  async addItem(userId: string, kelasId: string) {
    if (!kelasId) {
      throw apiError('VALIDATION_ERROR', 'kelasId wajib diisi.');
    }

    const mahasiswa = await this.getMahasiswaByUserId(userId);
    const tahunAktif = await this.getTahunAktif();
    const krs = await this.ensureEditableKrs(mahasiswa.id, tahunAktif.id);
    const kelas = await this.prisma.kelas.findUnique({
      where: { id: kelasId },
      include: {
        mataKuliah: true,
        jadwal: true,
        _count: { select: { ambilKrs: true } },
      },
    });

    if (!kelas || kelas.tahunAjaranId !== tahunAktif.id) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Kelas tidak ditemukan.',
      });
    }

    if (kelas._count.ambilKrs >= kelas.kuota) {
      throw apiError('CLASS_QUOTA_FULL', 'Kuota kelas sudah penuh.');
    }

    const existingSameClass = krs.items.some(
      (item) => item.kelasId === kelas.id,
    );

    if (existingSameClass) {
      throw apiError('VALIDATION_ERROR', 'Kelas sudah ada di KRS.');
    }

    const nextTotalSks =
      krs.items.reduce((total, item) => total + item.kelas.mataKuliah.sks, 0) +
      kelas.mataKuliah.sks;
    const maxSks = await this.getMaksSks(mahasiswa.id);

    if (nextTotalSks > maxSks) {
      throw apiError(
        'SKS_LIMIT_EXCEEDED',
        `Total SKS melebihi batas ${maxSks} SKS.`,
      );
    }

    const conflict = krs.items.find((item) =>
      this.isScheduleConflict(item.kelas.jadwal, kelas.jadwal),
    );

    if (conflict) {
      throw apiError(
        'SCHEDULE_CONFLICT',
        `Jadwal bentrok dengan ${conflict.kelas.mataKuliah.nama}.`,
      );
    }

    await this.prisma.ambilKrs.create({
      data: { krsId: krs.id, kelasId: kelas.id },
    });

    return this.refreshTotalAndReturn(krs.id);
  }

  async removeItem(userId: string, ambilKrsId: string) {
    const mahasiswa = await this.getMahasiswaByUserId(userId);
    const tahunAktif = await this.getTahunAktif();
    const krs = await this.ensureEditableKrs(mahasiswa.id, tahunAktif.id);
    const item = await this.prisma.ambilKrs.findFirst({
      where: { id: ambilKrsId, krsId: krs.id },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Item KRS tidak ditemukan.',
      });
    }

    await this.prisma.ambilKrs.delete({ where: { id: item.id } });

    return this.refreshTotalAndReturn(krs.id);
  }

  async submit(userId: string) {
    const mahasiswa = await this.getMahasiswaByUserId(userId);
    const tahunAktif = await this.getTahunAktif();
    const krs = await this.ensureEditableKrs(mahasiswa.id, tahunAktif.id);

    if (krs.items.length === 0) {
      throw apiError('VALIDATION_ERROR', 'KRS tidak boleh kosong.');
    }

    await this.revalidateKrs(krs.id, mahasiswa.id);

    const updated = await this.prisma.krs.update({
      where: { id: krs.id },
      data: {
        status: 'DIAJUKAN',
        tanggalPengajuan: new Date(),
        catatanDosen: null,
      },
      include: this.krsInclude(),
    });

    return this.mapKrs(updated);
  }

  async listApproval(userId: string) {
    const dosen = await this.getDosenByUserId(userId);
    const data = await this.prisma.krs.findMany({
      where: {
        mahasiswa: { dosenPaId: dosen.id },
        status: 'DIAJUKAN',
      },
      orderBy: { tanggalPengajuan: 'asc' },
      include: this.krsInclude(),
    });

    return data.map((item) => this.mapKrs(item));
  }

  async approve(userId: string, krsId: string) {
    const dosen = await this.getDosenByUserId(userId);
    await this.ensureDosenOwnsKrs(dosen.id, krsId);

    const updated = await this.prisma.krs.update({
      where: { id: krsId },
      data: {
        status: 'DISETUJUI',
        dosenApproverId: dosen.id,
        tanggalApproval: new Date(),
        catatanDosen: null,
      },
      include: this.krsInclude(),
    });

    return this.mapKrs(updated);
  }

  async reject(userId: string, krsId: string, catatanDosen?: string) {
    if (!catatanDosen?.trim()) {
      throw apiError(
        'VALIDATION_ERROR',
        'Catatan dosen wajib diisi saat reject.',
      );
    }

    const dosen = await this.getDosenByUserId(userId);
    await this.ensureDosenOwnsKrs(dosen.id, krsId);

    const updated = await this.prisma.krs.update({
      where: { id: krsId },
      data: {
        status: 'DITOLAK',
        dosenApproverId: dosen.id,
        tanggalApproval: new Date(),
        catatanDosen: catatanDosen.trim(),
      },
      include: this.krsInclude(),
    });

    return this.mapKrs(updated);
  }

  private async ensureDosenOwnsKrs(dosenId: string, krsId: string) {
    const krs = await this.prisma.krs.findFirst({
      where: { id: krsId, mahasiswa: { dosenPaId: dosenId } },
    });

    if (!krs) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'KRS tidak ditemukan.',
      });
    }

    if (krs.status !== 'DIAJUKAN') {
      throw apiError(
        'KRS_LOCKED',
        'KRS hanya bisa diproses saat status DIAJUKAN.',
      );
    }
  }

  private async ensureEditableKrs(mahasiswaId: string, tahunAjaranId: string) {
    const krs = await this.prisma.krs.upsert({
      where: { mahasiswaId_tahunAjaranId: { mahasiswaId, tahunAjaranId } },
      update: {},
      create: { mahasiswaId, tahunAjaranId },
      include: this.krsInclude(),
    });

    if (krs.status === 'DITOLAK') {
      return this.prisma.krs.update({
        where: { id: krs.id },
        data: { status: 'DRAFT', catatanDosen: null },
        include: this.krsInclude(),
      });
    }

    if (krs.status !== 'DRAFT') {
      throw apiError(
        'KRS_LOCKED',
        'KRS tidak bisa diedit pada status saat ini.',
      );
    }

    return krs;
  }

  private async refreshTotalAndReturn(krsId: string) {
    const krs = await this.prisma.krs.findUniqueOrThrow({
      where: { id: krsId },
      include: this.krsInclude(),
    });
    const totalSks = krs.items.reduce(
      (total, item) => total + item.kelas.mataKuliah.sks,
      0,
    );
    const updated = await this.prisma.krs.update({
      where: { id: krs.id },
      data: { totalSks },
      include: this.krsInclude(),
    });

    return this.mapKrs(updated);
  }

  private async revalidateKrs(krsId: string, mahasiswaId: string) {
    const krs = await this.prisma.krs.findUniqueOrThrow({
      where: { id: krsId },
      include: this.krsInclude(),
    });
    const maxSks = await this.getMaksSks(mahasiswaId);

    if (krs.totalSks > maxSks) {
      throw apiError(
        'SKS_LIMIT_EXCEEDED',
        `Total SKS melebihi batas ${maxSks} SKS.`,
      );
    }

    for (const item of krs.items) {
      const kelas = await this.prisma.kelas.findUniqueOrThrow({
        where: { id: item.kelasId },
        include: { _count: { select: { ambilKrs: true } } },
      });

      if (kelas._count.ambilKrs > kelas.kuota) {
        throw apiError('CLASS_QUOTA_FULL', 'Ada kelas yang melebihi kuota.');
      }
    }
  }

  private async getMaksSks(mahasiswaId: string) {
    const latestRekap = await this.prisma.rekapSemester.findFirst({
      where: { mahasiswaId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRekap) {
      return 20;
    }

    const ips = Number(latestRekap.ips);
    const aturan = await this.prisma.aturanBatasSks.findFirst({
      where: {
        ipsMin: { lte: ips },
        ipsMax: { gte: ips },
      },
    });

    return aturan?.maksSks ?? 20;
  }

  private async getMahasiswaByUserId(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });

    if (!mahasiswa) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Mahasiswa tidak ditemukan.',
      });
    }

    return mahasiswa;
  }

  private async getDosenByUserId(userId: string) {
    const dosen = await this.prisma.dosen.findUnique({
      where: { userId },
    });

    if (!dosen) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Dosen tidak ditemukan.',
      });
    }

    return dosen;
  }

  private async getTahunAktif() {
    const tahunAktif = await this.prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    if (!tahunAktif) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Tahun ajaran aktif tidak ditemukan.',
      });
    }

    return tahunAktif;
  }

  private isScheduleConflict(
    current: { hari: string; jamMulai: Date; jamSelesai: Date },
    next: { hari: string; jamMulai: Date; jamSelesai: Date },
  ) {
    return (
      current.hari === next.hari &&
      current.jamMulai < next.jamSelesai &&
      current.jamSelesai > next.jamMulai
    );
  }

  private krsInclude() {
    return {
      mahasiswa: { include: { dosenPa: true } },
      tahunAjaran: true,
      dosenApprover: true,
      items: {
        include: {
          kelas: {
            include: {
              mataKuliah: true,
              dosen: true,
              jadwal: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private mapKrs(
    krs: Awaited<ReturnType<typeof this.prisma.krs.findUniqueOrThrow>>,
  ) {
    return krs;
  }
}
