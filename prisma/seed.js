/* prisma/seed.js */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helpers
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const daysInMonth = (year, month1to12) =>
  new Date(year, month1to12, 0).getDate(); // month is 1-12

function isFriday(date) {
  // JS: 0=Sun..6=Sat ; Friday==5
  return date.getDay() === 5;
}

function weekday0Sun(date) {
  return date.getDay(); // 0..6
}

function mul(a, b) {
  // a,b as number -> string fixed(2)
  return (Number(a) * Number(b)).toFixed(2);
}

function div(a, b) {
  return (Number(a) / Number(b)).toFixed(2);
}

function add(a, b) {
  return (Number(a) + Number(b)).toFixed(2);
}

function sub(a, b) {
  return (Number(a) - Number(b)).toFixed(2);
}

async function main() {
  console.log("⏳ Clearing existing data…");
  // Delete in dependency order (children first)
  await prisma.advanceAllocation.deleteMany({});
  await prisma.payslipItem.deleteMany({});
  await prisma.employeePayslip.deleteMany({});
  await prisma.workDay.deleteMany({});
  await prisma.payrollRun.deleteMany({});
  await prisma.payrollPeriod.deleteMany({});
  await prisma.employeeAdvance.deleteMany({});
  await prisma.upload.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.machineTypeBonusTier.deleteMany({});
  await prisma.machineTypeSalary.deleteMany({});
  await prisma.designation.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.machineCompany.deleteMany({});
  await prisma.appSetting.deleteMany({});

  console.log("🌱 Seeding…");

  // ===== App Setting =====
  const appSetting = await prisma.appSetting.create({
    data: {
      fridayMultiplier: 2.5,
    },
  });

  // ===== Companies & Machines =====
  const alphaCo = await prisma.machineCompany.create({
    data: { name: "Alpha Textiles" },
  });
  const betaCo = await prisma.machineCompany.create({
    data: { name: "Beta Weaving" },
  });

  const m1 = await prisma.machine.create({
    data: {
      name: "H17-01",
      companyId: alphaCo.id,
      machineType: "H17",
    },
  });
  const m2 = await prisma.machine.create({
    data: {
      name: "H18-01",
      companyId: alphaCo.id,
      machineType: "H18",
    },
  });
  const m3 = await prisma.machine.create({
    data: {
      name: "H28-01",
      companyId: betaCo.id,
      machineType: "H28",
    },
  });

  // ===== Designations =====
  const [operator, karigar, helper, accountant] = await Promise.all([
    prisma.designation.create({
      data: {
        name: "Operator",
        slug: "operator",
        isVariablePay: true,
      },
    }),
    prisma.designation.create({
      data: {
        name: "Karigar",
        slug: "karigar",
        isVariablePay: true,
      },
    }),
    prisma.designation.create({
      data: {
        name: "Helper",
        slug: "helper",
        isVariablePay: true,
      },
    }),
    prisma.designation.create({
      data: {
        name: "Accountant",
        slug: "accountant",
        isVariablePay: false,
      },
    }),
  ]);

  // ===== MachineTypeSalary (Monthly) for variable-pay roles =====
  const varDesignations = [operator, karigar, helper];
  const machineTypes = ["H17", "H18", "H28", "H33", "H34"];
  const baseMonthlyByRole = {
    Operator: 60000,
    Karigar: 55000,
    Helper: 45000,
  };

  const machineTypeSalaryRecords = [];
  for (const mt of machineTypes) {
    for (const d of varDesignations) {
      const amount =
        d.name === "Operator"
          ? baseMonthlyByRole.Operator
          : d.name === "Karigar"
          ? baseMonthlyByRole.Karigar
          : baseMonthlyByRole.Helper;

      machineTypeSalaryRecords.push(
        prisma.machineTypeSalary.create({
          data: {
            machineType: mt,
            designationId: d.id,
            monthlySalary: amount.toFixed(2),
          },
        })
      );
    }
  }
  await Promise.all(machineTypeSalaryRecords);

  // ===== Bonus tiers per machine type =====
  // Tiers: 0-5000, 5001-15000, 15001+
  // two-head rate & sheet rate as decimals
  const tierDefs = [
    { min: 0, max: 5000, rateTwo: "0.0025", rateSheet: "0.0010" },
    { min: 5001, max: 15000, rateTwo: "0.0035", rateSheet: "0.0015" },
    { min: 15001, max: null, rateTwo: "0.0045", rateSheet: "0.0020" },
  ];

  const bonusTierCreates = [];
  for (const mt of machineTypes) {
    for (const t of tierDefs) {
      bonusTierCreates.push(
        prisma.machineTypeBonusTier.create({
          data: {
            machineType: mt,
            minStitches: t.min,
            maxStitches: t.max,
            rateTwoHead: t.rateTwo,
            rateSheet: t.rateSheet,
          },
        })
      );
    }
  }
  await Promise.all(bonusTierCreates);

  // ===== Employees =====
  const ali = await prisma.employee.create({
    data: {
      empCode: "EMP1001",
      name: "Ali Operator",
      gender: "MALE",
      cnic: "35202-1000001-1",
      phone: "0300-1111111",
      city: "Lahore",
      designationId: operator.id,
    },
  });
  const bilal = await prisma.employee.create({
    data: {
      empCode: "EMP1002",
      name: "Bilal Helper",
      gender: "MALE",
      cnic: "35202-1000002-2",
      phone: "0300-2222222",
      city: "Lahore",
      designationId: helper.id,
    },
  });
  const kamran = await prisma.employee.create({
    data: {
      empCode: "EMP1003",
      name: "Kamran Karigar",
      gender: "MALE",
      cnic: "35202-1000003-3",
      phone: "0300-3333333",
      city: "Lahore",
      designationId: karigar.id,
    },
  });
  const sara = await prisma.employee.create({
    data: {
      empCode: "EMP2001",
      name: "Sara Accountant",
      gender: "FEMALE",
      cnic: "35202-2000001-4",
      phone: "0300-4444444",
      city: "Lahore",
      designationId: accountant.id,
      fixedMonthlySalary: "80000.00",
    },
  });

  // ===== Advances =====
  const advAli = await prisma.employeeAdvance.create({
    data: {
      employeeId: ali.id,
      amount: "10000.00",
      takenOn: new Date("2025-08-05"),
      note: "Emergency advance",
    },
  });
  const advSara = await prisma.employeeAdvance.create({
    data: {
      employeeId: sara.id,
      amount: "20000.00",
      takenOn: new Date("2025-07-28"),
      note: "Home expense",
    },
  });

  // ===== Period (Use current month in your log: Aug 2025) =====
  const year = 2025;
  const month = 8; // August
  const period = await prisma.payrollPeriod.create({
    data: { year, month },
  });
// ===== Payroll Run (for H17-01) =====
const salaryOperatorH17 = await prisma.machineTypeSalary.findFirst({
  where: { machineType: m1.machineType, designationId: operator.id },
});
const salaryHelperH17 = await prisma.machineTypeSalary.findFirst({
  where: { machineType: m1.machineType, designationId: helper.id },
});
const tiersH17 = await prisma.machineTypeBonusTier.findMany({
  where: { machineType: m1.machineType },
  orderBy: { minStitches: "asc" },
});

// ✅ Create the run here
const run = await prisma.payrollRun.create({
  data: {
    machineId: m1.id,
    periodId: period.id,
    rateSnapshot: {
      fridayMultiplier: appSetting.fridayMultiplier,
      salaries: {
        operatorMonthly: salaryOperatorH17?.monthlySalary,
        helperMonthly: salaryHelperH17?.monthlySalary,
      },
      bonusTiers: tiersH17.map((t) => ({
        min: t.minStitches,
        max: t.maxStitches,
        rateTwoHead: t.rateTwoHead,
        rateSheet: t.rateSheet,
      })),
    },
  },
});


  // ===== WorkDays for 1–7 Aug 2025 =====
  // A = Ali (Operator), B = Bilal (Helper)
  const dim = daysInMonth(year, month);
  const dailyBaseOperator = div(salaryOperatorH17.monthlySalary, dim);
  const dailyBaseHelper = div(salaryHelperH17.monthlySalary, dim);
  const fm = appSetting.fridayMultiplier;

  // predefine stitches & bonus types per day for variety
  const plan = [
    {
      day: 1,
      stitches: 18000,
      bonusType: "TWO_HEAD",
      leaveA: false,
      leaveB: true /* Friday leave B */,
    },
    {
      day: 2,
      stitches: 4000,
      bonusType: "SHEET",
      leaveA: false,
      leaveB: false,
    },
    {
      day: 3,
      stitches: 8000,
      bonusType: "TWO_HEAD",
      leaveA: true,
      leaveB: false,
    }, // normal leave A (Sunday)
    {
      day: 4,
      stitches: 12000,
      bonusType: "SHEET",
      leaveA: false,
      leaveB: false,
    },
    {
      day: 5,
      stitches: 22000,
      bonusType: "TWO_HEAD",
      leaveA: false,
      leaveB: false,
    },
    {
      day: 6,
      stitches: 6000,
      bonusType: "SHEET",
      leaveA: false,
      leaveB: false,
    },
    {
      day: 7,
      stitches: 15000,
      bonusType: "TWO_HEAD",
      leaveA: false,
      leaveB: false,
    },
  ];

  // helper to find tier
  function pickTier(stitches) {
    const sorted = tiersH17
      .map((t) => ({
        min: t.minStitches,
        max: t.maxStitches,
        two: t.rateTwoHead,
        sheet: t.rateSheet,
      }))
      .sort((a, b) => a.min - b.min);

    for (const t of sorted) {
      if (t.max == null) {
        if (stitches >= t.min) return t;
      } else if (stitches >= t.min && stitches <= t.max) {
        return t;
      }
    }
    return sorted[0];
  }

  const workDays = [];
  let totals = {
    ali: { salary: "0.00", bonus: "0.00", fridayLeaves: 0, normalLeaves: 0 },
    bilal: { salary: "0.00", bonus: "0.00", fridayLeaves: 0, normalLeaves: 0 },
  };

  for (const row of plan) {
    const date = new Date(`${year}-${pad2(month)}-${pad2(row.day)}`);
    const friday = isFriday(date);
    const weekday = weekday0Sun(date);
    const tier = pickTier(row.stitches);

    const rateUsed = {
      tier: {
        min: tier.min,
        max: tier.max,
        rateTwoHead: tier.two,
        rateSheet: tier.sheet,
      },
      bonusType: row.bonusType,
    };

    const baseA = dailyBaseOperator;
    const baseB = dailyBaseHelper;

    const daySalaryA = row.leaveA ? "0.00" : friday ? mul(baseA, fm) : baseA;

    const daySalaryB = row.leaveB ? "0.00" : friday ? mul(baseB, fm) : baseB;

    if (row.leaveA) {
      if (friday) totals.ali.fridayLeaves += 1;
      else totals.ali.normalLeaves += 1;
    }
    if (row.leaveB) {
      if (friday) totals.bilal.fridayLeaves += 1;
      else totals.bilal.normalLeaves += 1;
    }

    // Bonus total for the day (before split)
    const rate = row.bonusType === "TWO_HEAD" ? tier.two : tier.sheet;
    const bonusTotal = mul(row.stitches, rate); // stitches * rate
    const bonusSplit = div(bonusTotal, 2);

    totals.ali.salary = add(totals.ali.salary, daySalaryA);
    totals.bilal.salary = add(totals.bilal.salary, daySalaryB);
    totals.ali.bonus = add(totals.ali.bonus, bonusSplit);
    totals.bilal.bonus = add(totals.bilal.bonus, bonusSplit);

    const wd = await prisma.workDay.create({
      data: {
        payrollRunId: run.id,
        date,
        weekday,
        isFriday: friday,
        bonusType: row.bonusType,
        stitches: row.stitches,
        rateUsed,
        bonusAmount: bonusTotal,
        employeeAId: ali.id,
        employeeBId: bilal.id,
        salaryA: daySalaryA,
        salaryB: daySalaryB,
        leaveANormal: !friday && row.leaveA,
        leaveAFriday: friday && row.leaveA,
        leaveBNormal: !friday && row.leaveB,
        leaveBFriday: friday && row.leaveB,
      },
    });
    workDays.push(wd);
  }

  // ===== Payslips for variable-pay employees in this run =====
  // Create per-employee payslip and itemize (salary per day + 50% of bonus per day)
  async function buildPayslipFor(emp, totalsObj) {
    // Advance allocations (example: partial against Ali)
    let advancesDeducted = "0.00";
    const allocations = [];

    if (emp.id === ali.id) {
      advancesDeducted = "6000.00";
      allocations.push({
        advanceId: advAli.id,
        amount: advancesDeducted,
      });
    }

    const grossSalary = totalsObj.salary;
    const grossBonus = totalsObj.bonus;
    const netPay = sub(add(grossSalary, grossBonus), advancesDeducted);

    const ps = await prisma.employeePayslip.create({
      data: {
        periodId: period.id,
        payrollRunId: run.id,
        employeeId: emp.id,
        grossSalary,
        grossBonus,
        holidaysCount: 0,
        fridayLeaves: totalsObj.fridayLeaves,
        normalLeaves: totalsObj.normalLeaves,
        advancesDeducted,
        netPay,
      },
    });

    // Create items for each WorkDay
    for (const wd of workDays) {
      // Salary item for this employee
      const salaryAmount =
        emp.id === ali.id ? wd.salaryA ?? "0.00" : wd.salaryB ?? "0.00";

      await prisma.payslipItem.create({
        data: {
          payslipId: ps.id,
          kind: "SALARY",
          amount: salaryAmount,
          description: `Daily salary for ${wd.date.toISOString().slice(0, 10)}`,
          workDayId: wd.id,
        },
      });

      // Bonus item (50% split)
      const half = div(wd.bonusAmount, 2);
      await prisma.payslipItem.create({
        data: {
          payslipId: ps.id,
          kind: "BONUS",
          amount: half,
          description: `50% of daily ${wd.bonusType} bonus on ${wd.date
            .toISOString()
            .slice(0, 10)} (${wd.stitches} stitches)`,
          workDayId: wd.id,
        },
      });
    }

    for (const al of allocations) {
      await prisma.advanceAllocation.create({
        data: {
          advanceId: al.advanceId,
          payslipId: ps.id,
          amount: al.amount,
        },
      });
    }

    return ps;
  }

  const psAli = await buildPayslipFor(ali, totals.ali);
  const psBilal = await buildPayslipFor(bilal, totals.bilal);

  const saraDeduct = "5000.00";
  const saraGross = "80000.00";
  const saraNet = sub(saraGross, saraDeduct);

  const psSara = await prisma.employeePayslip.create({
    data: {
      periodId: period.id,
      employeeId: sara.id,
      grossSalary: saraGross,
      grossBonus: "0.00",
      holidaysCount: 0,
      fridayLeaves: 0,
      normalLeaves: 0,
      advancesDeducted: saraDeduct,
      netPay: saraNet,
    },
  });

  await prisma.payslipItem.create({
    data: {
      payslipId: psSara.id,
      kind: "SALARY",
      amount: saraGross,
      description: "Monthly fixed salary",
    },
  });

  await prisma.advanceAllocation.create({
    data: {
      advanceId: advSara.id,
      payslipId: psSara.id,
      amount: saraDeduct,
    },
  });

  await prisma.upload.create({
    data: {
      kind: "SALARY_RATES",
      machineType: "H17",
      fileName: "salary_rates_h17.csv",
      rowCount: 3,
      meta: { importedBy: "seed", note: "Demo seed" },
    },
  });
  await prisma.upload.create({
    data: {
      kind: "BONUS_RATES",
      machineType: "H17",
      fileName: "bonus_tiers_h17.csv",
      rowCount: 3,
      meta: { importedBy: "seed", note: "Demo seed" },
    },
  });

  console.log("✅ Seed complete!");
  console.log({
    appSetting,
    companies: [alphaCo.name, betaCo.name],
    machines: [m1.name, m2.name, m3.name],
    period: `${period.year}-${pad2(period.month)}`,
    runId: run.id,
    payslips: { ali: psAli.id, bilal: psBilal.id, sara: psSara.id },
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

//   # 1) Ensure DB is running (you used :5433)
// # 2) Run the seed
// npm run db:seed
// # or
// npx prisma db seed
