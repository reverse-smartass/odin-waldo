-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Presets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
