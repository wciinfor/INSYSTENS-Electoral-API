-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "electoralNumber" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "urnName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "officeCode" INTEGER,
    "officeName" TEXT,
    "uf" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "partyNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollingLocation" (
    "id" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "locationCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectoralSection" (
    "id" TEXT NOT NULL,
    "pollingLocationId" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectoralSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionVote" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "candidateId" TEXT,
    "electoralSectionId" TEXT NOT NULL,
    "votesCount" INTEGER NOT NULL,
    "officeCode" INTEGER NOT NULL,
    "officeName" TEXT NOT NULL,
    "votableTypeCode" INTEGER,
    "votableType" TEXT NOT NULL,
    "votableNumber" TEXT,
    "votableName" TEXT,
    "partyNumber" INTEGER,
    "partyAcronym" TEXT,
    "partyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "errorDetails" TEXT NOT NULL,
    "rawData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionElectorateProfile" (
    "id" TEXT NOT NULL,
    "electionYear" INTEGER NOT NULL,
    "uf" TEXT NOT NULL,
    "cityCode" INTEGER NOT NULL,
    "cityName" TEXT NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "pollingLocationCode" INTEGER NOT NULL,
    "genderCode" INTEGER,
    "gender" TEXT,
    "ageRangeCode" TEXT,
    "ageRange" TEXT,
    "educationCode" INTEGER,
    "education" TEXT,
    "raceCode" INTEGER,
    "race" TEXT,
    "maritalStatusCode" INTEGER,
    "maritalStatus" TEXT,
    "voteObligationType" TEXT,
    "votersCount" INTEGER NOT NULL,
    "biometricVotersCount" INTEGER NOT NULL,
    "disabledVotersCount" INTEGER NOT NULL,
    "socialNameVotersCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionElectorateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Election_year_idx" ON "Election"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Election_year_round_type_key" ON "Election"("year", "round", "type");

-- CreateIndex
CREATE INDEX "Candidate_uf_idx" ON "Candidate"("uf");

-- CreateIndex
CREATE INDEX "Candidate_electionId_idx" ON "Candidate"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_electionId_electoralNumber_role_key" ON "Candidate"("electionId", "electoralNumber", "role");

-- CreateIndex
CREATE INDEX "PollingLocation_uf_idx" ON "PollingLocation"("uf");

-- CreateIndex
CREATE INDEX "PollingLocation_cityName_idx" ON "PollingLocation"("cityName");

-- CreateIndex
CREATE INDEX "PollingLocation_zoneNumber_idx" ON "PollingLocation"("zoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PollingLocation_uf_cityName_zoneNumber_locationCode_key" ON "PollingLocation"("uf", "cityName", "zoneNumber", "locationCode");

-- CreateIndex
CREATE INDEX "ElectoralSection_uf_idx" ON "ElectoralSection"("uf");

-- CreateIndex
CREATE INDEX "ElectoralSection_cityName_idx" ON "ElectoralSection"("cityName");

-- CreateIndex
CREATE INDEX "ElectoralSection_zoneNumber_idx" ON "ElectoralSection"("zoneNumber");

-- CreateIndex
CREATE INDEX "ElectoralSection_sectionNumber_idx" ON "ElectoralSection"("sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ElectoralSection_uf_cityName_zoneNumber_sectionNumber_key" ON "ElectoralSection"("uf", "cityName", "zoneNumber", "sectionNumber");

-- CreateIndex
CREATE INDEX "SectionVote_electionId_officeCode_idx" ON "SectionVote"("electionId", "officeCode");

-- CreateIndex
CREATE INDEX "SectionVote_electionId_candidateId_idx" ON "SectionVote"("electionId", "candidateId");

-- CreateIndex
CREATE INDEX "SectionVote_electionId_officeCode_votableType_idx" ON "SectionVote"("electionId", "officeCode", "votableType");

-- CreateIndex
CREATE INDEX "SectionVote_electionId_officeCode_votableNumber_idx" ON "SectionVote"("electionId", "officeCode", "votableNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SectionVote_electionId_electoralSectionId_officeCode_votabl_key" ON "SectionVote"("electionId", "electoralSectionId", "officeCode", "votableType", "votableNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "SectionElectorateProfile_uf_cityName_idx" ON "SectionElectorateProfile"("uf", "cityName");

-- CreateIndex
CREATE INDEX "SectionElectorateProfile_zoneNumber_sectionNumber_idx" ON "SectionElectorateProfile"("zoneNumber", "sectionNumber");

-- CreateIndex
CREATE INDEX "SectionElectorateProfile_electionYear_idx" ON "SectionElectorateProfile"("electionYear");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralSection" ADD CONSTRAINT "ElectoralSection_pollingLocationId_fkey" FOREIGN KEY ("pollingLocationId") REFERENCES "PollingLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionVote" ADD CONSTRAINT "SectionVote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionVote" ADD CONSTRAINT "SectionVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionVote" ADD CONSTRAINT "SectionVote_electoralSectionId_fkey" FOREIGN KEY ("electoralSectionId") REFERENCES "ElectoralSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;