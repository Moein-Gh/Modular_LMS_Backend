import { readFile } from 'fs/promises';
import * as path from 'path';
import {
  LedgerAccountType,
  PrismaClient,
  UserStatus,
} from '../generated/prisma';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Load bank data from JSON and seed idempotently
  try {
    const bankDataRaw = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'bank.json'),
      'utf8',
    );
    const bankData = JSON.parse(bankDataRaw) as {
      name: string;
      subscriptionFee: string | number;
      commissionPercentage?: string | number;
      defaultMaxInstallments?: number;
      installmentOptions?: number[];
      status?: string;
      currency?: string;
      timeZone?: string;
    };

    const existingBank = await prisma.bank.findFirst();
    if (!existingBank) {
      await prisma.bank.create({ data: bankData });
      console.log('Seeded initial Bank row');
    } else {
      console.log('Bank row already exists; skipping');
    }
  } catch (err) {
    console.error('Failed to seed bank from JSON:', err);
    throw err;
  }

  // Seed fixed Ledger Accounts (idempotent)
  await seedLedgerAccounts();

  // Seed AccountTypes (idempotent)
  await seedAccountTypes();

  // Seed LoanTypes (idempotent)
  await seedLoanTypes();

  // Seed Permissions from JSON (idempotent)
  await seedPermissions();

  // Seed roles
  await seedRoles();

  // Seed users from test-user.json and assign 'account-holder' role
  await seedUsersFromTestData();

  // Seed permission grants (e.g., give admin wildcard permission)
  await seedPermissionGrants();

  // Seed test user (idempotent)
  await seedTestUser();

  // Assign admin role to test user
  await seedAssignAdminToTestUser();
}

async function seedAssignAdminToTestUser(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'test-user.json'),
      'utf8',
    );
    const parsed = JSON.parse(data) as any;
    const u = Array.isArray(parsed) ? parsed[0] : parsed;
    const testPhone = u?.identity?.phone ?? u?.phone;

    const identity = await prisma.identity.findUnique({
      where: { phone: testPhone },
    });
    if (!identity) {
      console.warn(
        `Test identity with phone=${testPhone} not found; cannot assign role`,
      );
      return;
    }

    const user = await prisma.user.findUnique({
      where: { identityId: identity.id },
    });
    if (!user) {
      console.warn(
        `Test user for identity ${identity.id} not found; cannot assign role`,
      );
      return;
    }

    const role = await prisma.role.findUnique({ where: { key: 'admin' } });
    if (!role) {
      console.warn('Role "admin" not found; cannot assign to test user');
      return;
    }

    const existing = await prisma.roleAssignment.findFirst({
      where: { userId: user.id, roleId: role.id },
    });
    if (existing) {
      console.log('✓ Test user already has admin role; skipping');
      return;
    }

    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    console.log('✓ Assigned admin role to test user');
  } catch (err) {
    console.error('Failed to assign admin role to test user:', err);
    throw err;
  }
}

async function seedRoles(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'roles.json'),
      'utf8',
    );
    const roles = JSON.parse(data) as Array<{
      key: string;
      name: string;
      description?: string;
    }>;

    for (const r of roles) {
      const existing = await prisma.role.findUnique({ where: { key: r.key } });
      if (existing) {
        console.log(`✓ Role "${r.key}" already exists; skipping`);
        continue;
      }
      await prisma.role.create({ data: r });
      console.log(`✓ Created Role "${r.key}"`);
    }
  } catch (err) {
    console.error('Failed to seed roles from JSON:', err);
    throw err;
  }
}

async function seedPermissionGrants(): Promise<void> {
  try {
    // Find wildcard permission and admin role
    const permission = await prisma.permission.findUnique({
      where: { key: '*/*' },
    });
    const role = await prisma.role.findUnique({ where: { key: 'admin' } });

    if (!permission) {
      console.warn('Wildcard permission "*/*" not found; skipping grant');
      return;
    }
    if (!role) {
      console.warn('Role "admin" not found; skipping grant');
      return;
    }

    const existingRolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    if (existingRolePermission) {
      console.log(
        '✓ Admin already has wildcard permission (role-permission); skipping',
      );
      return;
    }

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
    console.log(
      '✓ Granted wildcard permission to admin role (role-permission)',
    );
  } catch (err) {
    console.error('Failed to seed role-permission grants:', err);
    throw err;
  }
}

async function seedPermissions(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'permissions.json'),
      'utf8',
    );
    const permissions = JSON.parse(data) as Array<{
      name: string;
      key: string;
      description?: string;
    }>;

    let created = 0;
    let skipped = 0;

    for (const p of permissions) {
      const existing = await prisma.permission.findUnique({
        where: { key: p.key },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.permission.create({
        data: {
          name: p.name,
          key: p.key,
          description: p.description ?? null,
        },
      });
      created++;
    }

    console.log(`Permissions: ${created} created, ${skipped} skipped`);
  } catch (err) {
    console.error('Failed to seed permissions:', err);
    throw err;
  }
}

async function seedLedgerAccounts(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'ledger-accounts.json'),
      'utf8',
    );
    const accounts = JSON.parse(data) as Array<{
      code: string;
      name: string;
      nameFa?: string;
      type: LedgerAccountType;
    }>;

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
        await prisma.ledgerAccount.create({ data: account });
        console.log(`  ✓ Created account ${account.code} - ${account.name}`);
        createdCount++;
      }
    }

    console.log(
      `LedgerAccounts: ${createdCount} created, ${skippedCount} skipped`,
    );
  } catch (err) {
    console.error('Failed to seed ledger accounts:', err);
    throw err;
  }
}

async function seedTestUser(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'test-user.json'),
      'utf8',
    );
    const parsed = JSON.parse(data) as any;
    const u = Array.isArray(parsed) ? parsed[0] : parsed;
    const testPhone = u?.identity?.phone ?? u?.phone;

    // Check if identity already exists
    let identity = await prisma.identity.findUnique({
      where: { phone: testPhone },
    });

    if (!identity) {
      identity = await prisma.identity.create({
        data: {
          countryCode: u.identity?.countryCode ?? u.countryCode ?? null,
          phone: u.identity?.phone ?? u.phone,
          name: u.identity?.name ?? u.name ?? null,
          email: u.identity?.email ?? u.email ?? null,
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
          status: u.status ?? UserStatus.ACTIVE,
        },
      });
      console.log('✓ Created test user');
    } else {
      console.log('✓ Test user already exists');
    }

    console.log(`Test user credentials: phone=${testPhone}`);
  } catch (err) {
    console.error('Failed to seed test user from JSON:', err);
    throw err;
  }
}

async function seedAccountTypes(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'account-types.json'),
      'utf8',
    );
    const accountTypes = JSON.parse(data) as Array<{
      name: string;
      maxAccounts?: number;
    }>;

    for (const accountType of accountTypes) {
      const existing = await prisma.accountType.findUnique({
        where: { name: accountType.name },
      });
      if (existing) {
        console.log(
          `✓ AccountType "${accountType.name}" already exists; skipping`,
        );
        continue;
      }
      await prisma.accountType.create({ data: accountType });
      console.log(`✓ Created AccountType "${accountType.name}"`);
    }
  } catch (err) {
    console.error('Failed to seed account types from JSON:', err);
    throw err;
  }
}

async function seedLoanTypes(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'loan-types.json'),
      'utf8',
    );
    const loanTypes = JSON.parse(data) as Array<{
      name: string;
      commissionPercentage?: number;
      defaultInstallments?: number;
      maxInstallments?: number;
      minInstallments?: number;
      creditRequirementPct?: number;
      description?: string;
    }>;

    for (const loanType of loanTypes) {
      const existing = await prisma.loanType.findUnique({
        where: { name: loanType.name },
      });
      if (existing) {
        console.log(`✓ LoanType "${loanType.name}" already exists; skipping`);
        continue;
      }
      await prisma.loanType.create({ data: loanType });
      console.log(`✓ Created LoanType "${loanType.name}"`);
    }
  } catch (err) {
    console.error('Failed to seed loan types from JSON:', err);
    throw err;
  }
}

async function seedUsersFromTestData(): Promise<void> {
  try {
    const data = await readFile(
      path.join(__dirname, '..', 'db-seed-data', 'test-user.json'),
      'utf8',
    );
    const parsed = JSON.parse(data) as Array<any>;
    if (!Array.isArray(parsed)) {
      console.warn('test-user.json is not an array; skipping bulk user seeding');
      return;
    }

    // Find the account-holder role if it exists
    const accountHolderRole = await prisma.role.findUnique({
      where: { key: 'account-holder' },
    });
    if (!accountHolderRole) {
      console.warn('Role "account-holder" not found; role assignments will be skipped');
    }

    for (const entry of parsed) {
      const identityData = entry.identity ?? {};
      const phone = identityData.phone;
      if (!phone) {
        console.warn('Skipping entry without phone:', entry);
        continue;
      }

      let identity = await prisma.identity.findUnique({ where: { phone } });
      if (!identity) {
        identity = await prisma.identity.create({
          data: {
            countryCode: identityData.countryCode ?? null,
            phone: identityData.phone,
            name: identityData.name ?? null,
            email: identityData.email ?? null,
          },
        });
        console.log(`✓ Created identity ${phone}`);
      } else {
        console.log(`✓ Identity ${phone} already exists`);
      }

      let user = await prisma.user.findUnique({
        where: { identityId: identity.id },
      });
      if (!user) {
        user = await prisma.user.create({
          data: { identityId: identity.id, status: UserStatus.ACTIVE },
        });
        console.log(`✓ Created user for ${phone}`);
      } else {
        console.log(`✓ User for ${phone} already exists`);
      }

      if (accountHolderRole) {
        const existing = await prisma.roleAssignment.findFirst({
          where: { userId: user.id, roleId: accountHolderRole.id },
        });
        if (!existing) {
          await prisma.roleAssignment.create({
            data: { userId: user.id, roleId: accountHolderRole.id, status: 'ACTIVE' },
          });
          console.log(`✓ Assigned role account-holder to ${phone}`);
        }
      }
    }
  } catch (err) {
    console.error('Failed to seed users from test-user.json:', err);
    throw err;
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
