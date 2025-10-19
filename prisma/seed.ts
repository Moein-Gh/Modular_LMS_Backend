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
  // Check if ledger accounts already exist
  const existingCount = await prisma.ledgerAccount.count();
  if (existingCount > 0) {
    console.log(
      `LedgerAccounts already exist (${existingCount} found); skipping seed`,
    );
    return;
  }

  const accounts: Array<{
    code: string;
    name: string;
    type: LedgerAccountType;
  }> = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Loans Receivable', type: 'ASSET' },
    { code: '2000', name: 'Customer Deposits', type: 'LIABILITY' },
    { code: '4100', name: 'Fee/Commision Income', type: 'INCOME' },
  ];

  await prisma.ledgerAccount.createMany({
    data: accounts,
  });

  console.log(`Seeded ${accounts.length} LedgerAccounts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
