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
}

async function seedLedgerAccounts(): Promise<void> {
  const accounts: Array<{
    code: string;
    name: string;
    type: LedgerAccountType;
  }> = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Loans Receivable', type: 'ASSET' },

    { code: '2000', name: 'Customer Deposits', type: 'LIABILITY' },
    { code: '2050', name: 'Unapplied Receipts', type: 'LIABILITY' },
    { code: '2100', name: 'Unapplied Disbursements', type: 'LIABILITY' },

    { code: '4100', name: 'Fee/Commission Income', type: 'INCOME' },
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
