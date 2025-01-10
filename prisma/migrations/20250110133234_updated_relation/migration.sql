-- CreateTable
CREATE TABLE "_FeedbackToLaundry" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FeedbackToLaundry_AB_unique" ON "_FeedbackToLaundry"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedbackToLaundry_B_index" ON "_FeedbackToLaundry"("B");

-- AddForeignKey
ALTER TABLE "_FeedbackToLaundry" ADD CONSTRAINT "_FeedbackToLaundry_A_fkey" FOREIGN KEY ("A") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackToLaundry" ADD CONSTRAINT "_FeedbackToLaundry_B_fkey" FOREIGN KEY ("B") REFERENCES "Laundry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
