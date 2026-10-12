-- AlterTable
ALTER TABLE "site_config" ALTER COLUMN "id" SET DEFAULT 'singleton';

-- CreateTable
CREATE TABLE "shipping_zone_state" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "shippingZoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_zone_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_zone_state_shippingZoneId_state_key" ON "shipping_zone_state"("shippingZoneId", "state");

-- AddForeignKey
ALTER TABLE "shipping_zone_state" ADD CONSTRAINT "shipping_zone_state_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "shipping_zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
