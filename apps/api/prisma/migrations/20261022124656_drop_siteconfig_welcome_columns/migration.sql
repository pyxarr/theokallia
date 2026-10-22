/*
  Warnings:

  - You are about to drop the column `welcomeDiscountExpiry` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeDiscountMinOrder` on the `site_config` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeDiscountPercent` on the `site_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_config" DROP COLUMN "welcomeDiscountExpiry",
DROP COLUMN "welcomeDiscountMinOrder",
DROP COLUMN "welcomeDiscountPercent";
