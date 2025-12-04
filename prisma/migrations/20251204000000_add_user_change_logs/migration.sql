-- AlterTable: Add relations to User model for change logs
-- (Relations are virtual, no database changes needed)

-- CreateTable: PhoneChangeLog
CREATE TABLE "PhoneChangeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldPhone" TEXT,
    "newPhone" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmailChangeLog
CREATE TABLE "EmailChangeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldEmail" TEXT,
    "newEmail" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneChangeLog_userId_idx" ON "PhoneChangeLog"("userId");

-- CreateIndex
CREATE INDEX "PhoneChangeLog_changedBy_idx" ON "PhoneChangeLog"("changedBy");

-- CreateIndex
CREATE INDEX "PhoneChangeLog_createdAt_idx" ON "PhoneChangeLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailChangeLog_userId_idx" ON "EmailChangeLog"("userId");

-- CreateIndex
CREATE INDEX "EmailChangeLog_changedBy_idx" ON "EmailChangeLog"("changedBy");

-- CreateIndex
CREATE INDEX "EmailChangeLog_createdAt_idx" ON "EmailChangeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PhoneChangeLog" ADD CONSTRAINT "PhoneChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneChangeLog" ADD CONSTRAINT "PhoneChangeLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChangeLog" ADD CONSTRAINT "EmailChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChangeLog" ADD CONSTRAINT "EmailChangeLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON UPDATE CASCADE;
