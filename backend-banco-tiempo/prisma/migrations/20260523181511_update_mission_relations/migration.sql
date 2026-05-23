/*
  Warnings:

  - You are about to drop the column `categoria` on the `Skill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "workerId" TEXT;

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "categoria";

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
