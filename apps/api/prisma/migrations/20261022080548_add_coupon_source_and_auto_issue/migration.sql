-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "autoIssue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT;
