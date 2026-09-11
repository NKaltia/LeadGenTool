-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);
