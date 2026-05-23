-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "titulo" TEXT NOT NULL DEFAULT 'Profesional Independiente';
