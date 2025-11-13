import { LedgerAccountType, PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.bank.findFirst();
  if (!existing) {
    await prisma.bank.create({
      data: {
        name: 'صندوق معین',
        subscriptionFee: '100000',
        commissionPercentage: '1',
        defaultMaxInstallments: 20,
        installmentOptions: [5, 10, 20],
        status: 'active',
        currency: 'Toman',
        timeZone: 'Asia/Tehran',
      },
    });
    console.log('Seeded initial Bank row');
  } else {
    console.log('Bank row already exists; skipping');
  }

  // Seed fixed Ledger Accounts (idempotent)
  await seedLedgerAccounts();

  // Seed AccountTypes (idempotent)
  await seedAccountTypes();

  // Seed LoanTypes (idempotent)
  await seedLoanTypes();

  // Seed test user (idempotent)
  await seedTestUser();
}

async function seedLedgerAccounts(): Promise<void> {
  const accounts: Array<{
    code: string;
    name: string;
    nameFa?: string;
    type: LedgerAccountType;
  }> = [
    // Assets
    { code: '1000', name: 'Cash', nameFa: 'وجه نقد', type: 'ASSET' },
    {
      code: '1100',
      name: 'Loans Receivable',
      nameFa: 'وام های دریافتنی',
      type: 'ASSET',
    },

    // Liabilities
    {
      code: '2000',
      name: 'Customer Deposits',
      nameFa: 'سپرده های مشتری',
      type: 'LIABILITY',
    },
    {
      code: '2050',
      name: 'Unapplied Receipts',
      nameFa: 'دریافت های تخصیص نیافته',
      type: 'LIABILITY',
    },
    {
      code: '2100',
      name: 'Unapplied Disbursements',
      nameFa: 'پرداخت های تخصیص نیافته',
      type: 'LIABILITY',
    },

    // Income
    {
      code: '4100',
      name: 'Fee/Commission Income',
      nameFa: 'درآمد کارمزد',
      type: 'INCOME',
    },
    {
      code: '4200',
      name: 'Subscription Fee Income',
      nameFa: 'اشتراک ماهیانه',
      type: 'INCOME',
    },

    // Expenses
    {
      code: '5100',
      name: 'Loan Repayment Expense',
      nameFa: 'پرداخت قسط وام',
      type: 'EXPENSE',
    },
    {
      code: '5200',
      name: 'Commission Expense',
      nameFa: 'هزینه کمیسیون',
      type: 'EXPENSE',
    },
    {
      code: '5300',
      name: 'Subscription Fee Expense',
      nameFa: 'هزینه حق عضویت',
      type: 'EXPENSE',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const account of accounts) {
    const existing = await prisma.ledgerAccount.findUnique({
      where: { code: account.code },
    });

    if (existing) {
      console.log(`  ✓ Account ${account.code} already exists; skipping`);
      skippedCount++;
    } else {
      await prisma.ledgerAccount.create({
        data: account,
      });
      console.log(`  ✓ Created account ${account.code} - ${account.name}`);
      createdCount++;
    }
  }

  console.log(
    `LedgerAccounts: ${createdCount} created, ${skippedCount} skipped`,
  );
}

async function seedTestUser(): Promise<void> {
  const testPhone = '9100971433';

  // Check if identity already exists
  let identity = await prisma.identity.findUnique({
    where: { phone: testPhone },
  });

  if (!identity) {
    identity = await prisma.identity.create({
      data: {
        nationalCode: '0022358218',
        countryCode: '98',
        phone: testPhone,
        name: 'معین قربانعلی',
        email: 'moein@test.com',
      },
    });
    console.log('✓ Created test identity');
  } else {
    console.log('✓ Test identity already exists');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { identityId: identity.id },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        identityId: identity.id,
        isActive: true,
      },
    });
    console.log('✓ Created test user');
  } else {
    console.log('✓ Test user already exists');
  }

  console.log(`Test user credentials: phone=${testPhone}`);
}

async function seedAccountTypes(): Promise<void> {
  const accountType = {
    name: 'معمولی',
    maxAccounts: 9999,
  };

  const existing = await prisma.accountType.findUnique({
    where: { name: accountType.name },
  });

  if (existing) {
    console.log('✓ AccountType "معمولی" already exists; skipping');
  } else {
    await prisma.accountType.create({
      data: accountType,
    });
    console.log('✓ Created AccountType "معمولی"');
  }
}

async function seedLoanTypes(): Promise<void> {
  const loanType = {
    name: 'معمولی',
    commissionPercentage: 1,
    defaultInstallments: 10,
    maxInstallments: 24,
    minInstallments: 1,
    creditRequirementPct: 20,
    description: 'وام معمولی',
  };

  const existing = await prisma.loanType.findUnique({
    where: { name: loanType.name },
  });

  if (existing) {
    console.log('✓ LoanType "معمولی" already exists; skipping');
  } else {
    await prisma.loanType.create({
      data: loanType,
    });
    console.log('✓ Created LoanType "معمولی"');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
