-- CreateTable
CREATE TABLE "Presets" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "nbRows" INTEGER NOT NULL,
    "nbCols" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Presets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
