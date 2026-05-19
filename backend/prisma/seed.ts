import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Hari, Role, Semester } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const mataKuliahSeed = [
  ['IF101', 'Dasar Pemrograman', 3, 1],
  ['IF102', 'Matematika Diskrit', 3, 1],
  ['IF103', 'Pengantar Teknologi Informasi', 2, 1],
  ['IF104', 'Kalkulus Informatika', 3, 1],
  ['IF105', 'Logika Informatika', 3, 1],
  ['IF106', 'Bahasa Inggris Teknologi', 2, 1],
  ['IF107', 'Pancasila', 2, 1],
  ['IF108', 'Algoritma dan Struktur Data', 2, 1],
  ['IF201', 'Pemrograman Berorientasi Objek', 3, 2],
  ['IF202', 'Basis Data', 3, 2],
  ['IF203', 'Sistem Digital', 3, 2],
  ['IF204', 'Statistika Komputasi', 3, 2],
  ['IF205', 'Arsitektur Komputer', 3, 2],
  ['IF206', 'Kewarganegaraan', 2, 2],
  ['IF207', 'Komunikasi Profesional', 3, 2],
  ['IF301', 'Pemrograman Web', 3, 3],
  ['IF302', 'Sistem Operasi', 3, 3],
  ['IF303', 'Jaringan Komputer', 3, 3],
  ['IF304', 'Rekayasa Perangkat Lunak', 3, 3],
  ['IF305', 'Analisis dan Desain Sistem', 3, 3],
  ['IF306', 'Basis Data Lanjut', 3, 3],
  ['IF307', 'Etika Profesi', 3, 3],
  ['IF401', 'Pemrograman Mobile', 3, 4],
  ['IF402', 'Kecerdasan Buatan', 3, 4],
  ['IF403', 'Interaksi Manusia dan Komputer', 3, 4],
  ['IF404', 'Manajemen Proyek TI', 3, 4],
  ['IF405', 'Keamanan Informasi', 3, 4],
  ['IF406', 'Data Mining', 3, 4],
  ['IF407', 'Metodologi Penelitian', 3, 4],
  ['IF501', 'Cloud Computing', 3, 5],
  ['IF502', 'Machine Learning', 3, 5],
  ['IF503', 'DevOps', 3, 5],
  ['IF504', 'Pengujian Perangkat Lunak', 3, 5],
  ['IF505', 'Sistem Terdistribusi', 3, 5],
  ['IF506', 'Grafika Komputer', 3, 5],
  ['IF507', 'Technopreneurship', 3, 5],
  ['IF601', 'Pemrosesan Bahasa Alami', 3, 6],
  ['IF602', 'Big Data', 3, 6],
  ['IF603', 'Internet of Things', 3, 6],
  ['IF604', 'Forensik Digital', 3, 6],
  ['IF605', 'Kerja Praktek', 4, 6],
  ['IF606', 'Seminar Proposal', 2, 6],
  ['IF701', 'Kapita Selekta Informatika', 3, 7],
  ['IF702', 'Audit Sistem Informasi', 3, 7],
  ['IF703', 'Manajemen Layanan TI', 3, 7],
  ['KU701', 'Kuliah Kerja Nyata', 4, 7],
  ['IF704', 'Seminar Hasil', 2, 7],
  ['IF705', 'Pilihan Riset Informatika', 2, 7],
  ['CS801', 'Tugas Akhir / Skripsi', 6, 8],
] as const;

const dosenSeed = [
  ['198501012010011001', 'Dr. Aris Setiawan', 'aris.cs'],
  ['198704122012012002', 'Dewi Lestari, M.Kom', 'dewi.lestari'],
  ['198903052014031003', 'Bima Pratama, M.T', 'bima.pratama'],
  ['199001172015041004', 'Citra Handayani, M.Cs', 'citra.handayani'],
  ['199205212018011005', 'Fajar Nugroho, M.Kom', 'fajar.nugroho'],
] as const;

const mahasiswaSeed = [
  ['20250001', 'Nadia Putri', 2025, '198501012010011001', 'mhs123'],
  ['20250002', 'Raka Mahendra', 2025, '198501012010011001', 'mhs123'],
  ['20230003', 'Salsa Kirana', 2023, '198704122012012002', 'mhs123'],
  ['20210004', 'Dion Saputra', 2021, '198903052014031003', 'mhs123'],
] as const;

function timeToday(hours: number, minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

async function main() {
  const adminPasswordHash = await hashPassword('admin123');

  await prisma.user.upsert({
    where: { username: 'admin_utama' },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN },
    create: {
      username: 'admin_utama',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  for (const [nip, nama, username] of dosenSeed) {
    const passwordHash = await hashPassword('password123');
    const user = await prisma.user.upsert({
      where: { username },
      update: { passwordHash, role: Role.DOSEN },
      create: { username, passwordHash, role: Role.DOSEN },
    });

    await prisma.dosen.upsert({
      where: { nip },
      update: { nama, userId: user.id },
      create: { nip, nama, userId: user.id },
    });
  }

  for (const [tahun, semester] of [
    ['2020/2021', Semester.GANJIL],
    ['2020/2021', Semester.GENAP],
    ['2021/2022', Semester.GANJIL],
    ['2021/2022', Semester.GENAP],
    ['2022/2023', Semester.GANJIL],
    ['2022/2023', Semester.GENAP],
    ['2023/2024', Semester.GANJIL],
    ['2023/2024', Semester.GENAP],
    ['2024/2025', Semester.GANJIL],
    ['2024/2025', Semester.GENAP],
    ['2025/2026', Semester.GANJIL],
  ] as const) {
    await prisma.tahunAjaran.upsert({
      where: { tahun_semester: { tahun, semester } },
      update: { isActive: tahun === '2025/2026' && semester === Semester.GANJIL },
      create: {
        tahun,
        semester,
        isActive: tahun === '2025/2026' && semester === Semester.GANJIL,
      },
    });
  }

  for (const [kode, nama, sks, semesterRekomendasi] of mataKuliahSeed) {
    await prisma.mataKuliah.upsert({
      where: { kode },
      update: { nama, sks, semesterRekomendasi },
      create: { kode, nama, sks, semesterRekomendasi },
    });
  }

  const jadwalSpecs = [
    [2, 8, 0, 9, 40],
    [2, 11, 0, 12, 40],
    [2, 14, 0, 15, 40],
    [3, 8, 0, 10, 30],
    [3, 11, 0, 13, 30],
    [3, 14, 0, 16, 30],
    [4, 8, 0, 11, 20],
    [6, 8, 0, 13, 0],
  ] as const;

  for (const hari of [Hari.SENIN, Hari.SELASA, Hari.RABU, Hari.KAMIS, Hari.JUMAT]) {
    for (const [sksAlokasi, mulaiJam, mulaiMenit, selesaiJam, selesaiMenit] of jadwalSpecs) {
      const existing = await prisma.jadwal.findFirst({
        where: {
          hari,
          sksAlokasi,
          jamMulai: timeToday(mulaiJam, mulaiMenit),
          jamSelesai: timeToday(selesaiJam, selesaiMenit),
        },
      });

      if (!existing) {
        await prisma.jadwal.create({
          data: {
            hari,
            sksAlokasi,
            jamMulai: timeToday(mulaiJam, mulaiMenit),
            jamSelesai: timeToday(selesaiJam, selesaiMenit),
          },
        });
      }
    }
  }

  const dosen = await prisma.dosen.findMany({ orderBy: { nama: 'asc' } });

  for (const [nim, nama, angkatan, dosenPaNip, password] of mahasiswaSeed) {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { username: nim },
      update: { passwordHash, role: Role.MAHASISWA },
      create: { username: nim, passwordHash, role: Role.MAHASISWA },
    });
    const dosenPa = await prisma.dosen.findUniqueOrThrow({
      where: { nip: dosenPaNip },
    });

    const mahasiswa = await prisma.mahasiswa.upsert({
      where: { nim },
      update: { nama, angkatan, userId: user.id, dosenPaId: dosenPa.id },
      create: { nim, nama, angkatan, userId: user.id, dosenPaId: dosenPa.id },
    });
    const tahunAjaran = await prisma.tahunAjaran.findFirstOrThrow({
      where: { tahun: '2024/2025', semester: Semester.GENAP },
    });

    await prisma.rekapSemester.upsert({
      where: {
        mahasiswaId_tahunAjaranId: {
          mahasiswaId: mahasiswa.id,
          tahunAjaranId: tahunAjaran.id,
        },
      },
      update: { ips: '3.20', ipk: '3.15' },
      create: {
        mahasiswaId: mahasiswa.id,
        tahunAjaranId: tahunAjaran.id,
        ips: '3.20',
        ipk: '3.15',
      },
    });
  }

  for (const [ipsMin, ipsMax, maksSks] of [
    ['0.00', '1.99', 18],
    ['2.00', '2.49', 20],
    ['2.50', '2.99', 22],
    ['3.00', '4.00', 24],
  ] as const) {
    const existing = await prisma.aturanBatasSks.findFirst({
      where: { ipsMin, ipsMax },
    });

    if (existing) {
      await prisma.aturanBatasSks.update({
        where: { id: existing.id },
        data: { maksSks },
      });
    } else {
      await prisma.aturanBatasSks.create({
        data: { ipsMin, ipsMax, maksSks },
      });
    }
  }

  const tahunAktif = await prisma.tahunAjaran.findFirstOrThrow({
    where: { tahun: '2025/2026', semester: Semester.GANJIL },
  });
  const mataKuliahAktif = await prisma.mataKuliah.findMany({
    where: { semesterRekomendasi: { in: [1, 3, 5, 7] } },
    orderBy: [{ semesterRekomendasi: 'asc' }, { kode: 'asc' }],
  });
  const jadwal = await prisma.jadwal.findMany({
    orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }],
  });

  let index = 0;
  for (const mataKuliah of mataKuliahAktif) {
    for (const kodeKelas of ['A', 'B']) {
      const jadwalCocok = jadwal.filter((item) => item.sksAlokasi === mataKuliah.sks);
      const selectedJadwal = jadwalCocok[index % jadwalCocok.length];
      const selectedDosen = dosen[index % dosen.length];

      await prisma.kelas.upsert({
        where: {
          mataKuliahId_tahunAjaranId_kodeKelas: {
            mataKuliahId: mataKuliah.id,
            tahunAjaranId: tahunAktif.id,
            kodeKelas,
          },
        },
        update: {
          dosenId: selectedDosen.id,
          jadwalId: selectedJadwal.id,
          nomorRuang: `R-${101 + (index % 10)}`,
          kuota: 30,
        },
        create: {
          mataKuliahId: mataKuliah.id,
          dosenId: selectedDosen.id,
          jadwalId: selectedJadwal.id,
          tahunAjaranId: tahunAktif.id,
          kodeKelas,
          nomorRuang: `R-${101 + (index % 10)}`,
          kuota: 30,
        },
      });
      index += 1;
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
