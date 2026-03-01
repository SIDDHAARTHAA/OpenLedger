-- CreateTable
CREATE TABLE "AssetPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetPurchase_transactionId_key" ON "AssetPurchase"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetPurchase_userId_assetId_key" ON "AssetPurchase"("userId", "assetId");

-- CreateIndex
CREATE INDEX "AssetPurchase_userId_createdAt_idx" ON "AssetPurchase"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AssetPurchase" ADD CONSTRAINT "AssetPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPurchase" ADD CONSTRAINT "AssetPurchase_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
