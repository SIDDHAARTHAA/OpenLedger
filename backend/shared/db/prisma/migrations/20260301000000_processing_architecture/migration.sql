-- CreateTable
CREATE TABLE "Processing" (
    "id" TEXT NOT NULL,
    "bankToken" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Processing_bankToken_key" ON "Processing"("bankToken");

-- CreateIndex
CREATE UNIQUE INDEX "Processing_transactionId_key" ON "Processing"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- AddForeignKey
ALTER TABLE "Processing" ADD CONSTRAINT "Processing_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
