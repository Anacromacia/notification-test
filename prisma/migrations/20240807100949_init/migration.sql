/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `userID` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userID]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `socketID` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ADD COLUMN     "socketID" VARCHAR(255) NOT NULL,
DROP COLUMN "userID",
ADD COLUMN     "userID" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("userID");

-- CreateTable
CREATE TABLE "notification" (
    "notificationID" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "header" VARCHAR(255) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "sender" VARCHAR(255) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notificationID")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userID_key" ON "users"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
