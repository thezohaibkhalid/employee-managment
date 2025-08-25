-- CreateEnum
CREATE TYPE "public"."MachineType" AS ENUM ('H17', 'H18', 'H28', 'H33', 'H34');

-- CreateEnum
CREATE TYPE "public"."BonusType" AS ENUM ('TWO_HEAD', 'SHEET');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "public"."PayslipItemType" AS ENUM ('SALARY', 'BONUS', 'HOLIDAY_BONUS', 'DEDUCTION', 'ADVANCE_DEDUCTION', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."AppSetting" (
    "id" TEXT NOT NULL,
    "fridayMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MachineCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVariablePay" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "machineType" "public"."MachineType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "empNumber" SERIAL NOT NULL,
    "empCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "dob" TIMESTAMP(3),
    "cnic" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "caste" TEXT,
    "gender" "public"."Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "bloodGroup" TEXT,
    "designationId" TEXT NOT NULL,
    "fixedMonthlySalary" DECIMAL(12,2),
    "referenceName" TEXT,
    "referencePhone" TEXT,
    "referenceRelation" TEXT,
    "contactPersonName" TEXT,
    "contactPersonNumber" TEXT,
    "contactPersonRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeAdvance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "takenOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "EmployeeAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollPeriod" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MachineTypeSalary" (
    "id" TEXT NOT NULL,
    "machineType" "public"."MachineType" NOT NULL,
    "designationId" TEXT NOT NULL,
    "monthlySalary" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineTypeSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MachineTypeBonusTier" (
    "id" TEXT NOT NULL,
    "machineType" "public"."MachineType" NOT NULL,
    "minStitches" INTEGER NOT NULL,
    "maxStitches" INTEGER,
    "rateTwoHead" DECIMAL(12,4) NOT NULL,
    "rateSheet" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineTypeBonusTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayrollRun" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "rateSnapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkDay" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isFriday" BOOLEAN NOT NULL DEFAULT false,
    "bonusType" "public"."BonusType" NOT NULL,
    "stitches" INTEGER NOT NULL DEFAULT 0,
    "rateUsed" JSONB NOT NULL,
    "bonusAmount" DECIMAL(12,2) NOT NULL,
    "employeeAId" TEXT,
    "employeeBId" TEXT,
    "salaryA" DECIMAL(12,2),
    "salaryB" DECIMAL(12,2),
    "leaveANormal" BOOLEAN NOT NULL DEFAULT false,
    "leaveAFriday" BOOLEAN NOT NULL DEFAULT false,
    "leaveBNormal" BOOLEAN NOT NULL DEFAULT false,
    "leaveBFriday" BOOLEAN NOT NULL DEFAULT false,
    "bonusOverride" DECIMAL(12,2),
    "note" TEXT,

    CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeePayslip" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "payrollRunId" TEXT,
    "employeeId" TEXT NOT NULL,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "grossBonus" DECIMAL(12,2) NOT NULL,
    "holidaysCount" INTEGER NOT NULL DEFAULT 0,
    "fridayLeaves" INTEGER NOT NULL DEFAULT 0,
    "normalLeaves" INTEGER NOT NULL DEFAULT 0,
    "advancesDeducted" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePayslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayslipItem" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "kind" "public"."PayslipItemType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "workDayId" TEXT,

    CONSTRAINT "PayslipItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdvanceAllocation" (
    "id" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "AdvanceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Upload" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "machineType" "public"."MachineType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MachineCompany_name_key" ON "public"."MachineCompany"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_name_key" ON "public"."Designation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_slug_key" ON "public"."Designation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_name_companyId_key" ON "public"."Machine"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empCode_key" ON "public"."Employee"("empCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cnic_key" ON "public"."Employee"("cnic");

-- CreateIndex
CREATE INDEX "EmployeeAdvance_employeeId_takenOn_idx" ON "public"."EmployeeAdvance"("employeeId", "takenOn");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_year_month_key" ON "public"."PayrollPeriod"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MachineTypeSalary_machineType_designationId_key" ON "public"."MachineTypeSalary"("machineType", "designationId");

-- CreateIndex
CREATE INDEX "MachineTypeBonusTier_machineType_minStitches_idx" ON "public"."MachineTypeBonusTier"("machineType", "minStitches");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_machineId_periodId_key" ON "public"."PayrollRun"("machineId", "periodId");

-- CreateIndex
CREATE INDEX "WorkDay_payrollRunId_date_idx" ON "public"."WorkDay"("payrollRunId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkDay_payrollRunId_date_key" ON "public"."WorkDay"("payrollRunId", "date");

-- CreateIndex
CREATE INDEX "EmployeePayslip_employeeId_periodId_idx" ON "public"."EmployeePayslip"("employeeId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePayslip_periodId_employeeId_key" ON "public"."EmployeePayslip"("periodId", "employeeId");

-- CreateIndex
CREATE INDEX "PayslipItem_payslipId_idx" ON "public"."PayslipItem"("payslipId");

-- CreateIndex
CREATE INDEX "PayslipItem_workDayId_idx" ON "public"."PayslipItem"("workDayId");

-- CreateIndex
CREATE INDEX "AdvanceAllocation_advanceId_idx" ON "public"."AdvanceAllocation"("advanceId");

-- CreateIndex
CREATE INDEX "AdvanceAllocation_payslipId_idx" ON "public"."AdvanceAllocation"("payslipId");

-- AddForeignKey
ALTER TABLE "public"."Machine" ADD CONSTRAINT "Machine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."MachineCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "public"."Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeAdvance" ADD CONSTRAINT "EmployeeAdvance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MachineTypeSalary" ADD CONSTRAINT "MachineTypeSalary_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "public"."Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollRun" ADD CONSTRAINT "PayrollRun_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayrollRun" ADD CONSTRAINT "PayrollRun_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkDay" ADD CONSTRAINT "WorkDay_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "public"."PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkDay" ADD CONSTRAINT "WorkDay_employeeAId_fkey" FOREIGN KEY ("employeeAId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkDay" ADD CONSTRAINT "WorkDay_employeeBId_fkey" FOREIGN KEY ("employeeBId") REFERENCES "public"."Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeePayslip" ADD CONSTRAINT "EmployeePayslip_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeePayslip" ADD CONSTRAINT "EmployeePayslip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "public"."PayrollRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeePayslip" ADD CONSTRAINT "EmployeePayslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayslipItem" ADD CONSTRAINT "PayslipItem_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "public"."EmployeePayslip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayslipItem" ADD CONSTRAINT "PayslipItem_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "public"."WorkDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvanceAllocation" ADD CONSTRAINT "AdvanceAllocation_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "public"."EmployeeAdvance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdvanceAllocation" ADD CONSTRAINT "AdvanceAllocation_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "public"."EmployeePayslip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
