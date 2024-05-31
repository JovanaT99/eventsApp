/*
  Warnings:

  - Added the required column `name` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- ALTER TABLE "Event" ADD COLUMN  "name" TEXT NOT NULL;

ALTER TABLE "Event" ADD COLUMN "name" VARCHAR(255) NOT NULL DEFAULT 'default_value';
ALTER TABLE "Event" ALTER COLUMN "name" DROP DEFAULT;
