-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MAHASISWA', 'DOSEN');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "Hari" AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT');

-- CreateEnum
CREATE TYPE "StatusKrs" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "nip" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "dosen_pa_id" UUID,
    "nim" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "angkatan" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahun_ajaran" (
    "id" UUID NOT NULL,
    "tahun" VARCHAR(9) NOT NULL,
    "semester" "Semester" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_kuliah" (
    "id" UUID NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "sks" INTEGER NOT NULL,
    "semester_rekomendasi" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mata_kuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" UUID NOT NULL,
    "hari" "Hari" NOT NULL,
    "jam_mulai" TIME NOT NULL,
    "jam_selesai" TIME NOT NULL,
    "sks_alokasi" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" UUID NOT NULL,
    "mata_kuliah_id" UUID NOT NULL,
    "dosen_id" UUID NOT NULL,
    "jadwal_id" UUID NOT NULL,
    "tahun_ajaran_id" UUID NOT NULL,
    "kode_kelas" VARCHAR(5) NOT NULL,
    "nomor_ruang" VARCHAR(20),
    "kuota" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aturan_batas_sks" (
    "id" UUID NOT NULL,
    "ips_min" DECIMAL(3,2) NOT NULL,
    "ips_max" DECIMAL(3,2) NOT NULL,
    "maks_sks" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aturan_batas_sks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krs" (
    "id" UUID NOT NULL,
    "mahasiswa_id" UUID NOT NULL,
    "tahun_ajaran_id" UUID NOT NULL,
    "status" "StatusKrs" NOT NULL DEFAULT 'DRAFT',
    "total_sks" INTEGER NOT NULL DEFAULT 0,
    "dosen_approver_id" UUID,
    "tanggal_pengajuan" TIMESTAMP(3),
    "tanggal_approval" TIMESTAMP(3),
    "catatan_dosen" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "krs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambil_krs" (
    "id" UUID NOT NULL,
    "krs_id" UUID NOT NULL,
    "kelas_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambil_krs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rekap_semester" (
    "id" UUID NOT NULL,
    "mahasiswa_id" UUID NOT NULL,
    "tahun_ajaran_id" UUID NOT NULL,
    "ips" DECIMAL(3,2) NOT NULL,
    "ipk" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rekap_semester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_user_id_key" ON "dosen"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nip_key" ON "dosen"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_user_id_key" ON "mahasiswa"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "tahun_ajaran_tahun_semester_key" ON "tahun_ajaran"("tahun", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "mata_kuliah_kode_key" ON "mata_kuliah"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_mata_kuliah_id_tahun_ajaran_id_kode_kelas_key" ON "kelas"("mata_kuliah_id", "tahun_ajaran_id", "kode_kelas");

-- CreateIndex
CREATE UNIQUE INDEX "krs_mahasiswa_id_tahun_ajaran_id_key" ON "krs"("mahasiswa_id", "tahun_ajaran_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambil_krs_krs_id_kelas_id_key" ON "ambil_krs"("krs_id", "kelas_id");

-- CreateIndex
CREATE UNIQUE INDEX "rekap_semester_mahasiswa_id_tahun_ajaran_id_key" ON "rekap_semester"("mahasiswa_id", "tahun_ajaran_id");

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_dosen_pa_id_fkey" FOREIGN KEY ("dosen_pa_id") REFERENCES "dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_mata_kuliah_id_fkey" FOREIGN KEY ("mata_kuliah_id") REFERENCES "mata_kuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_dosen_id_fkey" FOREIGN KEY ("dosen_id") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_dosen_approver_id_fkey" FOREIGN KEY ("dosen_approver_id") REFERENCES "dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambil_krs" ADD CONSTRAINT "ambil_krs_krs_id_fkey" FOREIGN KEY ("krs_id") REFERENCES "krs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambil_krs" ADD CONSTRAINT "ambil_krs_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rekap_semester" ADD CONSTRAINT "rekap_semester_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rekap_semester" ADD CONSTRAINT "rekap_semester_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "tahun_ajaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
