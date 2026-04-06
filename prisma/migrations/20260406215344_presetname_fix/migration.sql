/*
  Warnings:

  - You are about to drop the column `prestetName` on the `Presets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Presets" DROP COLUMN "prestetName",
ADD COLUMN     "presetName" TEXT NOT NULL DEFAULT 'Preset';
