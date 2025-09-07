/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { PrismaClient } from '@generated/prisma';

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
