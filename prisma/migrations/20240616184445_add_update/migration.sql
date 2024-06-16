/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventAttendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_eventId_userId_key" ON "EventAttendance"("eventId", "userId");
