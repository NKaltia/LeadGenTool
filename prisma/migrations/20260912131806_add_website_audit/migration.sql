-- CreateTable
CREATE TABLE "WebsiteAudit" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isReachable" BOOLEAN NOT NULL,
    "httpStatus" INTEGER,
    "responseTimeMs" INTEGER,
    "finalUrl" TEXT,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebsiteAudit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WebsiteAudit" 
  ADD CONSTRAINT "WebsiteAudit_businessId_fkey" 
  FOREIGN KEY ("businessId") 
  REFERENCES "Business"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
