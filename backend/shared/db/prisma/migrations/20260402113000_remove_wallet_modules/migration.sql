-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Processing" DROP CONSTRAINT "Processing_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "AssetPurchase" DROP CONSTRAINT "AssetPurchase_userId_fkey";

-- DropForeignKey
ALTER TABLE "AssetPurchase" DROP CONSTRAINT "AssetPurchase_transactionId_fkey";

-- DropTable
DROP TABLE "Processing";

-- DropTable
DROP TABLE "AssetPurchase";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "Account";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";
