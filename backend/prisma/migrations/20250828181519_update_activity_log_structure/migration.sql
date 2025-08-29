/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "productId" INTEGER,
    "productSku" TEXT,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("action", "id", "userId") SELECT "action", "id", "userId" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
