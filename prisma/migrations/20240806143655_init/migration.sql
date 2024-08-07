/*
  Warnings:

  - You are about to drop the `StudentList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "StudentList";

-- CreateTable
CREATE TABLE "users" (
    "userID" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("username")
);
