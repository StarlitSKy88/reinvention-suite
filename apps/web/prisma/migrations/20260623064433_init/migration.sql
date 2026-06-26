-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER', 'GOV_OFFICER', 'USER');

-- CreateEnum
CREATE TYPE "RewriteType" AS ENUM ('GENERAL', 'FOR_JD', 'AGE_MASKED', 'DISCRIM_SAFE');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('COMPANY_WEBSITE', 'BOSS_ZHIPIN', 'LAGOU', 'LIEPIN', 'LINKEDIN', 'EXA', 'ZHILIAN', 'CCGP', 'HRSS_BULLETIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('CCGP', 'HRSS_BULLETIN', 'BIDDING_NETWORK', 'MANUAL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "wechatOpenId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "regionCode" TEXT,
    "govProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT,
    "experiences" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "skills" TEXT[],
    "projects" JSONB NOT NULL,
    "rawTextHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "targetJobId" TEXT,
    "targetCompany" TEXT,
    "rewriteType" "RewriteType" NOT NULL,
    "content" TEXT NOT NULL,
    "factSources" JSONB NOT NULL,
    "matchScore" INTEGER,
    "ageMaskApplied" BOOLEAN NOT NULL DEFAULT false,
    "discrimCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "userAccepted" BOOLEAN,
    "userFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactBase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projects" JSONB NOT NULL,
    "skills" JSONB NOT NULL,
    "experiences" JSONB NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyName" TEXT,
    "location" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT DEFAULT 'CNY',
    "description" TEXT NOT NULL,
    "requirements" TEXT[],
    "keywords" TEXT[],
    "source" "JobSource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "applyUrl" TEXT,
    "postedAt" TIMESTAMP(3),
    "industry" TEXT,
    "seniorityLevel" TEXT,
    "companySize" TEXT,
    "companyProfile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matchedKeywords" TEXT[],
    "missingKeywords" TEXT[],
    "reasoning" TEXT,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "interviewInvited" BOOLEAN NOT NULL DEFAULT false,
    "offerReceived" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GapReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "jobTitle" TEXT,
    "matchScore" INTEGER NOT NULL,
    "missingSkills" JSONB NOT NULL,
    "missingExperience" TEXT[],
    "optimizationSuggestions" JSONB NOT NULL,
    "rewrittenResume" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GapReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectIncubation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "milestones" JSONB NOT NULL,
    "deliverables" JSONB NOT NULL,
    "resumeDescription" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectIncubation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovSuccessCase" (
    "id" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "unemploymentMonths" INTEGER NOT NULL,
    "targetJob" TEXT NOT NULL,
    "originalSalary" INTEGER NOT NULL,
    "newSalary" INTEGER NOT NULL,
    "storyNarrative" TEXT NOT NULL,
    "regionCode" TEXT,
    "govProgramId" TEXT,
    "permissionGranted" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovSuccessCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovOpportunity" (
    "id" TEXT NOT NULL,
    "source" "OpportunitySource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "location" TEXT,
    "budget" TEXT,
    "description" TEXT,
    "publishDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "keywordScore" INTEGER NOT NULL,
    "budgetScore" INTEGER NOT NULL,
    "freshnessScore" INTEGER NOT NULL,
    "regionScore" INTEGER NOT NULL,
    "buyerTypeScore" INTEGER NOT NULL,
    "competitionScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "recommendation" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "regionCode" TEXT,
    "govProgramId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "status" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKeyConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "encryptedKey" TEXT,
    "keyMask" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT,
    "highQualityOnly" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "User"("wechatOpenId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_regionCode_idx" ON "User"("regionCode");

-- CreateIndex
CREATE INDEX "User_govProgramId_idx" ON "User"("govProgramId");

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex
CREATE INDEX "ResumeVersion_userId_idx" ON "ResumeVersion"("userId");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeVersion_targetJobId_idx" ON "ResumeVersion"("targetJobId");

-- CreateIndex
CREATE INDEX "FactBase_userId_idx" ON "FactBase"("userId");

-- CreateIndex
CREATE INDEX "JobPosting_company_idx" ON "JobPosting"("company");

-- CreateIndex
CREATE INDEX "JobPosting_industry_idx" ON "JobPosting"("industry");

-- CreateIndex
CREATE INDEX "JobPosting_location_idx" ON "JobPosting"("location");

-- CreateIndex
CREATE INDEX "JobPosting_source_idx" ON "JobPosting"("source");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_source_sourceUrl_key" ON "JobPosting"("source", "sourceUrl");

-- CreateIndex
CREATE INDEX "Match_userId_idx" ON "Match"("userId");

-- CreateIndex
CREATE INDEX "Match_jobId_idx" ON "Match"("jobId");

-- CreateIndex
CREATE INDEX "Match_score_idx" ON "Match"("score");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userId_jobId_key" ON "Match"("userId", "jobId");

-- CreateIndex
CREATE INDEX "GapReport_userId_idx" ON "GapReport"("userId");

-- CreateIndex
CREATE INDEX "GapReport_jobId_idx" ON "GapReport"("jobId");

-- CreateIndex
CREATE INDEX "ProjectIncubation_userId_idx" ON "ProjectIncubation"("userId");

-- CreateIndex
CREATE INDEX "ProjectIncubation_status_idx" ON "ProjectIncubation"("status");

-- CreateIndex
CREATE INDEX "ProjectIncubation_templateId_idx" ON "ProjectIncubation"("templateId");

-- CreateIndex
CREATE INDEX "GovSuccessCase_regionCode_idx" ON "GovSuccessCase"("regionCode");

-- CreateIndex
CREATE INDEX "GovSuccessCase_govProgramId_idx" ON "GovSuccessCase"("govProgramId");

-- CreateIndex
CREATE INDEX "GovSuccessCase_isPublic_idx" ON "GovSuccessCase"("isPublic");

-- CreateIndex
CREATE INDEX "GovOpportunity_totalScore_idx" ON "GovOpportunity"("totalScore");

-- CreateIndex
CREATE INDEX "GovOpportunity_recommendation_idx" ON "GovOpportunity"("recommendation");

-- CreateIndex
CREATE INDEX "GovOpportunity_status_idx" ON "GovOpportunity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GovOpportunity_source_sourceUrl_key" ON "GovOpportunity"("source", "sourceUrl");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_anonymousUserId_idx" ON "AnalyticsEvent"("anonymousUserId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_regionCode_idx" ON "AnalyticsEvent"("regionCode");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiKeyConfig_userId_idx" ON "ApiKeyConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeyConfig_userId_provider_key" ON "ApiKeyConfig"("userId", "provider");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactBase" ADD CONSTRAINT "FactBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapReport" ADD CONSTRAINT "GapReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIncubation" ADD CONSTRAINT "ProjectIncubation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyConfig" ADD CONSTRAINT "ApiKeyConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
