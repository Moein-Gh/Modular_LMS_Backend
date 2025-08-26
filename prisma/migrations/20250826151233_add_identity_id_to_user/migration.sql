/*
  Warnings:

  - You are about to drop the column `user_id` on the `identity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `identityId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."identity" DROP CONSTRAINT "identity_user_id_fkey";

-- DropIndex
DROP INDEX "public"."identity_user_id_key";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "identityId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."identity" DROP COLUMN "user_id";

-- CreateIndex
CREATE UNIQUE INDEX "User_identityId_key" ON "public"."User"("identityId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
