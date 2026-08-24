---
applyTo: '**'
---

# Business Logic — Modular LMS Backend

## 1. Platform Overview

This is a **Loan Management System (LMS)** built as a NestJS monorepo. It manages the full lifecycle of a member-funded lending cooperative (similar to a credit union or قرض‌الحسنه):

- Members join, make deposits, and become eligible for loans.
- Loans are funded from pooled member deposits.
- Repayments are tracked as installments.
- All money movement is recorded in a double-entry ledger.
- Two separate API surfaces:
  - **`api-admin`** — back-office operations (approve loans, manage users, view ledger, send messages, etc.)
  - **`api-user`** — member-facing operations (view own account, submit loan requests, view installments, etc.)

---

## 2. Bounded Contexts

### 2.1 User & Identity

#### Domain Entity — `User`

**File**: `libs/domain/src/user/entities/user.entity.ts`

| Field             | Type                  | Notes                                             |
| ----------------- | --------------------- | ------------------------------------------------- |
| `id`              | `string` (UUID)       | Primary key, used in API URLs and relations       |
| `code`            | `number`              | Auto-increment integer, human-friendly display ID |
| `identityId`      | `string` (UUID)       | FK to `Identity`; 1-to-1, always present          |
| `status`          | `UserStatus`          | `ACTIVE` \| `INACTIVE`                            |
| `identity`        | `Partial<Identity>?`  | Eager-loaded in most queries                      |
| `balanceSummary`  | `UserBalanceSummary?` | Computed on `findById`; not stored in DB          |
| `roleAssignments` | `RoleAssignment[]?`   | Eager-loaded; only non-deleted assignments        |
| `isDeleted`       | `boolean`             | Soft-delete flag                                  |
| `deletedAt`       | `Date?`               | Set when soft-deleted                             |
| `deletedBy`       | `string?` (UUID)      | Admin UUID who deleted the user                   |

**`UserBalanceSummary`**: `{ accounts: AccountBalanceResult[], loans: LoanBalanceResult[] }` — computed via `JournalBalanceUsecase`; attached to the user result on every `findById` call.

**`UserWithPermissions`**: extends `User` with `permissions: string[]` — used in auth context after login.

#### Domain Entity — `Identity`

**File**: Prisma `identity` table, mapped in `PrismaUserRepository.mapIdentity()`

| Field         | Type        | Notes                                 |
| ------------- | ----------- | ------------------------------------- |
| `id`          | UUID        | PK                                    |
| `phone`       | `string`    | Unique; used for login                |
| `email`       | `string?`   | Optional; unique when present         |
| `name`        | `string?`   | Display name                          |
| `countryCode` | `string?`   | E.g., `+98`                           |
| `lastLoginAt` | `DateTime?` | Updated on successful login           |
| `isDeleted`   | `boolean`   | Soft-deleted together with its `User` |

**Rule**: `Identity` is always created before `User`. A `User` without an `Identity` cannot exist.
**Rule**: Soft-deleting a `User` also soft-deletes its `Identity` atomically inside a DB transaction.
**Rule**: Restoring a `User` also restores its `Identity` atomically.

#### Value Object — `Email`

**File**: `libs/domain/src/user/value-objects/email.vo.ts`

- Validates email format via `zod` at creation (`Email.create()`).
- Immutable; exposes `.primitive` (string) and `.equals()`.

#### Status Lifecycle

```
ACTIVE ──── setActive(INACTIVE) ──── INACTIVE
  ▲                                      │
  └─────── setActive(ACTIVE) ────────────┘
```

- New users are created as `ACTIVE`.
- An admin can toggle status via `UsersService.setActive()`.
- An admin cannot change their own status (enforced in controller: `canChangeStatus = currentUserId !== id`).
- Inactive users can still log in unless auth guards check for `ACTIVE` status explicitly.

#### Registration Flow — `RegisterUserUseCase`

**File**: `libs/application/src/auth/use-cases/register-user.usecase.ts`

Steps (all inside one DB transaction):

1. Check if `Identity` already exists by `phone+countryCode` (or `email`). Throw `IdentityAlreadyExistsError` if so.
2. Create `Identity` via `IdentitiesService.createIdentity()`.
3. Find or create `User` linked to that `Identity`.
4. Create `RoleAssignment` rows for each supplied `roleId`.

**Input** (`RegisterUserInput`):
| Field | Validation |
|---|---|
| `phone` | digits only, 8–15 chars |
| `email` | optional, valid email |
| `name` | string, 2–50 chars |
| `countryCode` | string, 1–5 chars |
| `roles` | array of role UUIDs (must exist) |

#### Service Methods — `UsersService`

**File**: `libs/application/src/user/services/users.service.ts`

| Method                                        | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `create(input, tx?)`                          | Creates `User` only (no Identity); called from `RegisterUserUseCase`           |
| `findById(id, tx?)`                           | Returns `User` + fills `balanceSummary` via `JournalBalanceUsecase`            |
| `findByIdentityId(identityId, tx?)`           | Lookup by identity FK                                                          |
| `findAll(query?, tx?)`                        | Paginated list; includes `identity` and `roleAssignments` (non-deleted)        |
| `update(id, input, tx?)`                      | Updates user-level fields (`status`); then re-fetches with `findById`          |
| `setActive(userId, status, tx?)`              | Toggles ACTIVE/INACTIVE                                                        |
| `softDelete(id, currentUserId, tx?)`          | Marks user + identity as deleted                                               |
| `restore(id, tx?)`                            | Undeletes user + identity                                                      |
| `getUserUpcomingPayments(userId, query, tx?)` | Returns all installments + subscription fees grouped by Persian calendar month |
| `getUserPaymentSummary(userId, tx?)`          | Dashboard summary: next month's total + overdue total                          |
| `getUserOverview(userId, tx?)`                | Dashboard tile data: account count/balance, loan count/amounts/%, etc.         |

All methods are transaction-aware: pass `tx` to run within an existing transaction, or omit to get an auto-wrapped transaction.

#### Repository — `IUserRepository`

**File**: `libs/domain/src/user/repositories/user.repository.ts`
**Implementation**: `libs/infra/src/user/repositories/prisma-user.repository.ts`
**DI Token**: `USER_REPOSITORY` (constant)

Key implementation details:

- All queries filter `isDeleted: false` by default.
- `findAll()` / `findById()` always include `identity` and `roleAssignments → role` via `userRelationsInclude` constant.
- `softDelete()` wraps Identity + User updates in one transaction.
- `restore()` requires `isDeleted: true` on the User; throws `NotFoundError` if already active.
- `findActiveUserOrThrow()` filters by both `isDeleted: false` AND `status: ACTIVE`.

#### API Endpoints

**Admin API** (`apps/api-admin/src/users/users.controller.ts`):

| Method   | Path                           | Permission     | Description                                    |
| -------- | ------------------------------ | -------------- | ---------------------------------------------- |
| `POST`   | `/users`                       | `user/create`  | Register new user (via `RegisterUserUseCase`)  |
| `GET`    | `/users`                       | `user/get`     | Paginated user list                            |
| `GET`    | `/users/:id`                   | `user/get`     | Single user with identity + balance summary    |
| `PATCH`  | `/users/:id`                   | `user/update`  | Update status, name, phone, email, countryCode |
| `DELETE` | `/users/:id`                   | `user/delete`  | Soft-delete user                               |
| `POST`   | `/users/:id/restore`           | `user/restore` | Restore soft-deleted user                      |
| `GET`    | `/users/:id/upcoming-payments` | `user/get`     | Installments + fees grouped by Persian month   |
| `GET`    | `/users/:id/payment-summary`   | `user/get`     | Dashboard: next-month + overdue totals         |

**User API** (`apps/api-user/src/user/users.controller.ts`):

| Method | Path                       | Permission      | Description                                  |
| ------ | -------------------------- | --------------- | -------------------------------------------- |
| `GET`  | `/users/upcoming-payments` | `user/user/get` | Current user's upcoming payments (self only) |

#### Response DTOs

**`GetUserDto`** (`apps/api-admin/src/users/dtos/get-user.dto.ts`):
`id`, `code`, `status`, `identityId`, `identity` (full), `balanceSummary`

**`UpdateUserDto`** (`apps/api-admin/src/users/dtos/update-user.dto.ts`):
All fields optional: `status`, `name`, `phone`, `countryCode`, `email`

**`UpcomingPaymentsResponseDto`**:

```ts
{
  upcomingMonths: MonthlyPaymentDto[];  // future months with payments
  pastMonths: MonthlyPaymentDto[];      // past months (paid included if includePastPaid=true)
  grandTotal: string;
  totalPaid: string;
  totalUnpaid: string;
}
```

Each `MonthlyPaymentDto` has: `month` (e.g., `"1402-12"`), `monthName`, `items` (installments + fees), `total`, `totalPaid`, `totalUnpaid`, `lastDayOfMonth`, `lastDayOfMonthPersian`.

**`PaymentSummaryDto`** (dashboard):
`upcomingAmount`, `upcomingDueDate`, `overdueAmount`, `totalDueAmount`

**`UserOverviewDto`** (dashboard tiles):
`activeAccountsCount`, `totalAccountBalance`, `activeLoansCount`, `totalLoanAmount`, `totalLoanPaid`, `totalLoanOutstanding`, `loanPaymentPercentage`

#### Business Rules

- A user can only be created with at least one valid role UUID.
- A user cannot change their own `status` (admin-only toggle).
- `phone` is the unique login identifier; changing it via PATCH updates the `Identity` record.
- Soft-deleting a user cascades to the `Identity` in the same transaction.
- Upcoming payments query includes ALL past-unpaid items regardless of `includePastPaid`; the flag only controls whether past-paid months appear.
- All monetary amounts in service output are formatted as decimals (4 d.p., trailing zeros stripped).

### 2.2 Authentication & Sessions

#### Auth Flow Overview

```
1. POST /auth/request-sms  →  SmsCode created in DB, code sent via SMS
2. POST /auth/verify-sms   →  SmsCode verified → AccessToken + RefreshToken issued as HttpOnly cookies
3. POST /auth/refresh      →  Old RefreshToken rotated → new pair of cookies issued
4. POST /auth/logout       →  RefreshToken revoked, cookies cleared, device optionally revoked
5. GET  /auth/me           →  Returns currently authenticated user (from cookie-attached access token)
```

#### Domain Entity — `SmsCode`

**File**: `libs/domain/src/auth/entities/sms-code.entity.ts`
**Prisma model**: `SmsCode`

| Field         | Type      | Notes                                                                                |
| ------------- | --------- | ------------------------------------------------------------------------------------ |
| `id`          | UUID      | PK                                                                                   |
| `phone`       | `string`  | The phone number the code was sent to                                                |
| `code`        | `string`  | 6-digit numeric code                                                                 |
| `purpose`     | `string`  | Free-text purpose tag (e.g., `"login"`)                                              |
| `attempts`    | `number`  | Incremented on each failed verification                                              |
| `maxAttempts` | `number`  | Default 5; code is invalid once `attempts >= maxAttempts`                            |
| `expiresAt`   | `Date`    | Code expires at this time (default TTL from `SMS_CODE_EXPIRES_IN` env, default 300s) |
| `consumedAt`  | `Date?`   | Set when code is successfully used; prevents reuse                                   |
| `isDeleted`   | `boolean` | Soft-delete                                                                          |

**Invalidation rules**: A code is rejected if any of these is true:

- `consumedAt` is not null (already consumed)
- `expiresAt` is in the past (expired)
- `attempts >= maxAttempts` (too many wrong guesses, default 5)

After a successful `verify-sms`, the `SmsCode` row is **deleted** (hard delete).

#### Domain Entity — `Session` / `RefreshToken`

**File**: `libs/domain/src/auth/entities/session.entity.ts`
**Prisma model**: `RefreshToken`

| Field               | Type      | Notes                                                                            |
| ------------------- | --------- | -------------------------------------------------------------------------------- |
| `id`                | UUID      | PK; also used as `sessionId` returned to client                                  |
| `userId`            | UUID      | FK to `User`                                                                     |
| `tokenHash`         | `string`  | SHA-256 hash of the raw token — **never store raw token**                        |
| `revoked`           | `boolean` | True when token is invalidated                                                   |
| `expiresAt`         | `Date`    | Long-lived expiry (default from `REFRESH_TOKEN_EXPIRES_IN` env, default 30 days) |
| `revokedAt`         | `Date?`   | Set when revoked                                                                 |
| `replacedByTokenId` | `UUID?`   | Chain pointer for rotation tracking                                              |
| `userAgent`         | `string?` | Client user-agent at issue time                                                  |
| `ipAddress`         | `string?` | Client IP at issue time                                                          |
| `isDeleted`         | `boolean` | Soft-delete                                                                      |

**Token rotation**: On each `/auth/refresh`, the old token is marked `revoked: true` and a new record is created. The raw token value is random 32 bytes (hex). Only the SHA-256 hash is stored.

#### Domain Entity — `Device`

**File**: `libs/domain/src/auth/entities/device.entity.ts`
**Prisma model**: `Device`

| Field        | Type      | Notes                                                  |
| ------------ | --------- | ------------------------------------------------------ |
| `id`         | UUID      | PK                                                     |
| `userId`     | UUID      | FK to `User`                                           |
| `deviceId`   | `string`  | Client-supplied identifier (from `x-device-id` header) |
| `deviceName` | `string?` | Human-readable name (from `x-device-name` header)      |
| `ip`         | `string?` | IP at last seen                                        |
| `userAgent`  | `string?` | User-agent at last seen                                |
| `lastSeen`   | `Date`    | Updated on every login/refresh for the same device     |
| `revoked`    | `boolean` | Set to true on logout when `deviceId` is provided      |

**Device matching logic**: If a device with the same `deviceId` already exists and belongs to the same user, its `lastSeen`/`userAgent`/`ip` are updated. If it belongs to a different user, a new record is created.

#### Value Objects

**`AccessToken`** (`libs/domain/src/auth/value-objects/access-token.vo.ts`):

- Custom HS256 JWT (header.body.sig, base64url, HMAC-SHA256 signed with `JWT_SECRET`).
- Payload: `{ sub: userId, phone, exp }`.
- `AccessToken.create(payload, secret, expiresInSec)` — factory method.
- Default TTL: `ACCESS_TOKEN_EXPIRES_IN` env variable (default 900s / 15 min).

**`RefreshToken`** (`libs/domain/src/auth/value-objects/refresh-token.vo.ts`):

- `crypto.randomBytes(32).toString('hex')` — 64-char hex string.
- `hash` = `SHA-256(value)` — stored in DB, never the raw value.
- `RefreshToken.create(expiresInSec)` — factory method.
- Default TTL: `REFRESH_TOKEN_EXPIRES_IN` env variable (default 2592000s / 30 days).

#### Cookie Transport

Tokens are delivered as **HttpOnly cookies** (not in response body):

- `accessToken` cookie: `httpOnly: true`, `sameSite: lax`, `secure: true` in production only.
- `refreshToken` cookie: same flags, longer `maxAge`.
- `AccessTokenGuard` reads the `accessToken` cookie — not the `Authorization` header.
- On logout, both cookies are cleared by setting `maxAge: 0`.

#### Service — `AuthService`

**File**: `libs/application/src/auth/services/auth.service.ts`

| Method                            | Description                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `requestSmsCode(cmd)`             | Looks up Identity by phone, checks user is ACTIVE, creates `SmsCode` row, sends SMS |
| `verifySmsCode(cmd, deviceMeta?)` | Validates code, deletes it, issues AccessToken + RefreshToken, upserts Device       |
| `refresh(refreshToken)`           | Hashes the raw token, looks up non-revoked session, rotates token pair              |
| `logout(cmd, deviceId?)`          | Revokes RefreshToken by sessionId, optionally revokes Device, clears cookies        |

#### Guard — `AccessTokenGuard`

**File**: `libs/application/src/auth/guards/access-token.guard.ts`

- Reads `accessToken` cookie, validates HMAC-SHA256 signature and `exp`.
- Fetches fresh user from DB and checks `status === ACTIVE`.
- Attaches full `User` object to `req.user` for downstream handlers.
- Skips validation for routes decorated with `@Public()`.

#### Service — `DevicesService`

**File**: `libs/application/src/auth/services/devices.service.ts`

| Method                          | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| `create(input, tx?)`            | Create a new device record                            |
| `findById(id, tx?)`             | Throws `NotFoundError` if missing                     |
| `findByDeviceId(deviceId, tx?)` | Lookup by client-supplied device identifier           |
| `findByUserId(userId, tx?)`     | All devices for a user                                |
| `list(params?, tx?)`            | Paginated/filtered device list                        |
| `update(id, input, tx?)`        | Update `lastSeen`, `userAgent`, `ip`, `revoked`, etc. |

#### API Endpoints

Both `api-admin` and `api-user` expose the same auth routes under `/auth`.

| Method | Path                | Auth                 | Description                     |
| ------ | ------------------- | -------------------- | ------------------------------- |
| `POST` | `/auth/request-sms` | Public               | Send OTP to phone               |
| `POST` | `/auth/verify-sms`  | Public               | Verify OTP, set auth cookies    |
| `POST` | `/auth/refresh`     | Public (uses cookie) | Rotate token pair               |
| `GET`  | `/auth/me`          | Protected            | Return current user from cookie |
| `POST` | `/auth/logout`      | Protected            | Revoke session, clear cookies   |

Device metadata is read from request headers:

- `x-device-id`: client device identifier
- `x-device-name`: human-readable device name
- `user-agent`: standard HTTP header
- `x-forwarded-for`: client IP (first value)

#### Error Types

**File**: `libs/application/src/auth/errors/auth.errors.ts`

| Error Class                    | HTTP | Code                         | When thrown                             |
| ------------------------------ | ---- | ---------------------------- | --------------------------------------- |
| `SmsCodeInvalidError`          | 400  | `SMS_CODE_INVALID`           | Code not found, expired, or consumed    |
| `SmsCodeAttemptsExceededError` | 429  | `SMS_CODE_ATTEMPTS_EXCEEDED` | `attempts >= maxAttempts`               |
| `AuthSessionRevokedError`      | 401  | `AUTH_SESSION_REVOKED`       | Refresh token is revoked                |
| `InvalidOrExpiredCodeError`    | 400  | —                            | OTP check fails in service              |
| `IdentityAlreadyExistsError`   | 409  | —                            | Registration with duplicate phone/email |

#### Business Rules

- Only `ACTIVE` users can request or verify SMS codes; inactive users receive `400`.
- A `SmsCode` row is hard-deleted (not soft-deleted) after successful verification.
- Refresh token raw values are **never** stored; only SHA-256 hashes.
- On token refresh, old token is always revoked before new one is issued (rotation).
- A device update only happens if the `deviceId` matches the same user; cross-user `deviceId` collision creates a new record.
- `@Public()` decorator bypasses `AccessTokenGuard` for open endpoints (SMS request/verify, refresh).
- `hasUnreadPushNotifications` flag is computed live on login and refresh by checking unread `MessageRecipient` rows for that user.

### 2.3 Access Control (RBAC + Direct Grants)

#### Domain Entity — `Role`

**File**: `libs/domain/src/access/entities/role.entity.ts`

| Field         | Type             | Notes                                                         |
| ------------- | ---------------- | ------------------------------------------------------------- |
| `id`          | UUID             | PK                                                            |
| `code`        | `number`         | Auto-increment display ID                                     |
| `name`        | `string`         | Display name                                                  |
| `key`         | `string`         | Unique machine-readable identifier (e.g., `admin`, `member`)  |
| `description` | `string?`        | Optional notes                                                |
| `createdAt`   | `Date`           | —                                                             |
| `updatedAt`   | `Date`           | —                                                             |
| `isDeleted`   | `boolean`        | Soft-delete                                                   |
| `deletedAt`   | `Date?`          | —                                                             |
| `deletedBy`   | `string?` (UUID) | —                                                             |
| `userCount`   | `number?`        | Computed: count of ACTIVE `RoleAssignment` rows for this role |

#### Domain Entity — `Permission`

**File**: `libs/domain/src/access/entities/permission.entity.ts`

| Field         | Type      | Notes                                                                                           |
| ------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `id`          | UUID      | PK                                                                                              |
| `code`        | `number`  | Auto-increment display ID                                                                       |
| `key`         | `string`  | Permission key — follows `scope/resource/action` convention (e.g., `admin/transaction/approve`) |
| `name`        | `string`  | Human-readable display name                                                                     |
| `description` | `string?` | Optional notes                                                                                  |
| `createdAt`   | `Date`    | —                                                                                               |
| `updatedAt`   | `Date`    | —                                                                                               |
| `isDeleted`   | `boolean` | Soft-delete                                                                                     |

#### Domain Entity — `RoleAssignment`

**File**: `libs/domain/src/access/entities/role-assignment.entity.ts`

| Field        | Type                   | Notes                                                        |
| ------------ | ---------------------- | ------------------------------------------------------------ |
| `id`         | UUID                   | PK                                                           |
| `userId`     | UUID                   | FK to `User`                                                 |
| `roleId`     | UUID                   | FK to `Role`                                                 |
| `assignedBy` | `string?` (UUID)       | Admin who created the assignment                             |
| `expiresAt`  | `Date?`                | Optional expiry; expired assignments are treated as inactive |
| `status`     | `RoleAssignmentStatus` | `ACTIVE` \| `INACTIVE`                                       |
| `user`       | `User?`                | Eager-loaded (includes `identity.name`)                      |
| `role`       | `Role?`                | Eager-loaded                                                 |
| `createdAt`  | `Date`                 | —                                                            |
| `updatedAt`  | `Date`                 | —                                                            |
| `isDeleted`  | `boolean`              | Soft-delete                                                  |

#### Domain Entity — `RolePermission`

**File**: `libs/domain/src/access/entities/role-permission.entity.ts`

Junction table linking `Role` → `Permission`.

| Field          | Type          | Notes              |
| -------------- | ------------- | ------------------ |
| `id`           | UUID          | PK                 |
| `roleId`       | UUID          | FK to `Role`       |
| `permissionId` | UUID          | FK to `Permission` |
| `role`         | `Role?`       | Eager-loaded       |
| `permission`   | `Permission?` | Eager-loaded       |
| `createdAt`    | `Date`        | —                  |
| `isDeleted`    | `boolean`     | Soft-delete        |

#### Domain Entity — `PermissionGrant`

**File**: `libs/domain/src/access/entities/permission-grant.entity.ts`

Allows overriding or supplementing role-based permissions for individual users or entire roles.

| Field          | Type             | Notes                                            |
| -------------- | ---------------- | ------------------------------------------------ |
| `id`           | UUID             | PK                                               |
| `granteeType`  | `GrantType`      | `USER` \| `ROLE`                                 |
| `granteeId`    | UUID             | FK to `User` (if USER) or `Role` (if ROLE)       |
| `permissionId` | UUID             | FK to `Permission`                               |
| `grantedBy`    | `string?` (UUID) | Admin who created the grant                      |
| `isGranted`    | `boolean`        | `true` = explicit allow; `false` = explicit deny |
| `reason`       | `string?`        | Optional justification note                      |
| `expiresAt`    | `Date?`          | Optional expiry                                  |
| `createdAt`    | `Date`           | —                                                |
| `updatedAt`    | `Date`           | —                                                |
| `isDeleted`    | `boolean`        | Soft-delete                                      |

#### Permission Resolution Flow — `PermissionsLoaderService`

**File**: `libs/application/src/access/permissions-loader.service.ts`

Resolves the full set of effective permission keys for a user. Results are **cached per-user** (TTL: 60 seconds, keyed as `perms:{userId}`) using NestJS `CACHE_MANAGER`.

**`getPermissions(userId)` flow**:

1. Check cache — return immediately if hit.
2. Load all ACTIVE `RoleAssignment` rows for the user; collect `roleIds`.
3. Fetch `PermissionGrant` rows where `(granteeType=USER, granteeId=userId, isGranted=true)` OR `(granteeType=ROLE, granteeId IN roleIds, isGranted=true)`.
4. Fetch `RolePermission` rows for all `roleIds` via `findByRoleId`.
5. Union all `permissionId` values from grants and role-permissions; de-duplicate.
6. Fetch `Permission` records by IDs; extract `.key` strings.
7. Cache result and return.

**`invalidate(userId)`**: evicts cached permissions for the user (call after role/grant changes).

#### Guard — `PermissionsGuard`

**File**: `libs/application/src/access/guards/permissions.guard.ts`

- Applied globally to all admin routes via `@Permissions('scope/resource/action')` decorator.
- Reads required permissions from route metadata (set by `@Permissions()` decorator).
- Loads user permissions via `PermissionsLoaderService` if not already in `req.user.permissions`.
- **Wildcard matching**: segments separated by `/`; a `*` segment matches any value. E.g., user permission `admin/*` matches `admin/transaction/approve`. Matching is segment-by-segment, the longer path wins.
- Denies access if: no authenticated user, no permissions loaded, or any required permission is not matched.
- Routes without `@Permissions()` are open (guard returns `true`).

#### Service — `RolesService`

**File**: `libs/application/src/access/services/roles.service.ts`

| Method                               | Description                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `create(input)`                      | Creates a new role                                                                                                              |
| `getById(id, tx?)`                   | Throws `NotFoundError` if missing                                                                                               |
| `getByKey(key, tx?)`                 | Lookup by unique `key`; throws `NotFoundError` if missing                                                                       |
| `findAll(query?, tx?)`               | Paginated list; searchable by `name`, `key`, `description`; enriches each result with `userCount` (count of ACTIVE assignments) |
| `update(id, data, tx?)`              | Partial update; throws `NotFoundError` if missing                                                                               |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted; throws `NotFoundError` if missing                                                                             |

#### Service — `PermissionsService`

**File**: `libs/application/src/access/services/permissions.service.ts`

| Method                               | Description                                                |
| ------------------------------------ | ---------------------------------------------------------- |
| `create(input, tx?)`                 | Creates a new permission                                   |
| `getById(id, tx?)`                   | Throws `NotFoundError` if missing                          |
| `getByKey(key, tx?)`                 | Lookup by unique `key`; throws `NotFoundError` if missing  |
| `findAll(query?, tx?)`               | Paginated list; searchable by `name`, `key`, `description` |
| `update(id, data, tx?)`              | Partial update; throws `NotFoundError` if missing          |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                           |

#### Service — `RoleAssignmentsService`

**File**: `libs/application/src/access/services/role_assignments.service.ts`

| Method                               | Description                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `create(input, tx?)`                 | Creates a new assignment (link user to role)                                               |
| `getById(id, tx?)`                   | Throws `NotFoundError` if missing                                                          |
| `findAll(query?, tx?)`               | Paginated list; filterable by `userId`, `roleId`; includes `role` and `user.identity.name` |
| `update(id, data, tx?)`              | Partial update (`status`, `expiresAt`, etc.)                                               |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                                                           |

#### Service — `RolePermissionsService`

**File**: `libs/application/src/access/services/role-permissions.service.ts`

| Method                                  | Description                                                          |
| --------------------------------------- | -------------------------------------------------------------------- |
| `create(input, tx?)`                    | Validates role and permission exist, then creates junction row       |
| `getById(id, tx?)`                      | Throws `NotFoundError` if missing                                    |
| `findByRoleId(roleId, tx?)`             | All permissions for a given role                                     |
| `findByPermissionId(permissionId, tx?)` | All roles that have a given permission                               |
| `list(tx?)`                             | Full unfiltered list of all role-permission mappings                 |
| `update(id, data, tx?)`                 | Partial update                                                       |
| `delete(id, tx?)`                       | Hard-delete (not soft-delete) — removes the permission from the role |

#### Service — `PermissionGrantsService`

**File**: `libs/application/src/access/services/permission-grants.service.ts`

| Method                          | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `create(input)`                 | Creates a new grant (explicit allow or deny)              |
| `getById(id)`                   | Throws `NotFoundError` if missing                         |
| `findAll(query?, tx?)`          | Paginated list                                            |
| `update(id, data)`              | Partial update (`isGranted`, `reason`, `expiresAt`, etc.) |
| `softDelete(id, currentUserId)` | Marks as deleted                                          |

#### API Endpoints

**Admin API** — `RolesController` (`apps/api-admin/src/access/roles/roles.controller.ts`):

| Method   | Path         | Description                     |
| -------- | ------------ | ------------------------------- |
| `POST`   | `/roles`     | Create a role                   |
| `GET`    | `/roles`     | Paginated list with `userCount` |
| `GET`    | `/roles/:id` | Single role                     |
| `DELETE` | `/roles/:id` | Soft-delete                     |

**Admin API** — `PermissionsController` (`apps/api-admin/src/access/permissions/permissions.controller.ts`):

| Method   | Path               | Description         |
| -------- | ------------------ | ------------------- |
| `POST`   | `/permissions`     | Create a permission |
| `GET`    | `/permissions`     | Paginated list      |
| `GET`    | `/permissions/:id` | Single permission   |
| `DELETE` | `/permissions/:id` | Soft-delete         |

**Admin API** — `RoleAssignmentsController` (`apps/api-admin/src/access/roleAssignments/roleAssignments.controller.ts`):

| Method   | Path                    | Description                                      |
| -------- | ----------------------- | ------------------------------------------------ |
| `POST`   | `/role-assignments`     | Assign a role to a user                          |
| `GET`    | `/role-assignments`     | Paginated list; filterable by `userId`, `roleId` |
| `GET`    | `/role-assignments/:id` | Single assignment                                |
| `DELETE` | `/role-assignments/:id` | Soft-delete                                      |

**Admin API** — `RolePermissionsController` (`apps/api-admin/src/access/rolePermissions/rolePermissions.controller.ts`):

| Method   | Path                                            | Permission                              | Description                                        |
| -------- | ----------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `POST`   | `/role-permissions`                             | `admin/rolePermission/create`           | Grant permission to a role                         |
| `GET`    | `/role-permissions`                             | `admin/rolePermission/list`             | All role-permission mappings                       |
| `GET`    | `/role-permissions/by-role/:roleId`             | `admin/rolePermission/listByRole`       | All permissions for a role                         |
| `GET`    | `/role-permissions/by-permission/:permissionId` | `admin/rolePermission/listByPermission` | All roles with a permission                        |
| `GET`    | `/role-permissions/:id`                         | `admin/rolePermission/getById`          | Single mapping                                     |
| `PATCH`  | `/role-permissions/:id`                         | `admin/rolePermission/update`           | Update mapping                                     |
| `DELETE` | `/role-permissions/:id`                         | `admin/rolePermission/delete`           | Hard-delete mapping (removes permission from role) |

**Admin API** — `PermissionGrantsController` (`apps/api-admin/src/access/permissionGrants/permissionGrants.controller.ts`):

| Method   | Path                     | Description                                      |
| -------- | ------------------------ | ------------------------------------------------ |
| `POST`   | `/permission-grants`     | Create an explicit grant or deny                 |
| `GET`    | `/permission-grants`     | Paginated list                                   |
| `GET`    | `/permission-grants/:id` | Single grant                                     |
| `PUT`    | `/permission-grants/:id` | Full update (`isGranted`, `reason`, `expiresAt`) |
| `DELETE` | `/permission-grants/:id` | Soft-delete                                      |

#### Business Rules

- Permission keys follow a `scope/resource/action` pattern (e.g., `admin/transaction/approve`, `user/account/findAll`).
- `PermissionsGuard` uses wildcard segment matching: `admin/*` grants access to all admin routes; `*/*` is a superuser grant.
- `PermissionGrant` with `isGranted = false` is **not** an explicit deny in the current guard implementation — the guard only checks `isGranted = true` grants. Deny logic must be added if needed.
- User permissions are cached for 60 seconds per user; call `PermissionsLoaderService.invalidate(userId)` after any role or grant change.
- `RolePermission.delete` is a hard-delete (removes the row); all other entities use soft-delete.
- No permission guards are applied to `api-user`; user-facing endpoints rely on the `AccessTokenGuard` for auth and service-level ownership checks for authorization.

### 2.4 Bank, AccountType & Account

#### Domain Entity — `AccountType`

**File**: `libs/domain/src/bank/entities/account-type.entity.ts`

| Field         | Type             | Notes                                                       |
| ------------- | ---------------- | ----------------------------------------------------------- |
| `id`          | UUID             | PK                                                          |
| `code`        | `number`         | Auto-increment display ID                                   |
| `name`        | `string`         | Unique name (e.g., "Regular", "Premium")                    |
| `maxAccounts` | `number \| null` | Max accounts of this type a user can hold; null = unlimited |
| `createdAt`   | `Date`           | —                                                           |
| `updatedAt`   | `Date`           | —                                                           |
| `isDeleted`   | `boolean`        | Soft-delete                                                 |
| `deletedAt`   | `Date?`          | —                                                           |
| `deletedBy`   | `string?` (UUID) | —                                                           |

#### Domain Entity — `Account`

**File**: `libs/domain/src/bank/entities/account.entity.ts`

| Field            | Type                    | Notes                                                          |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| `id`             | UUID                    | PK                                                             |
| `code`           | `number`                | Auto-increment display ID                                      |
| `accountTypeId`  | UUID                    | FK to `AccountType`                                            |
| `name`           | `string`                | Auto-generated as `"{bankName}-{last4ofCard}"` if not provided |
| `userId`         | UUID                    | FK to `User` (account owner)                                   |
| `cardNumber`     | `string`                | Globally unique; must be exactly 8 digits on create            |
| `bankName`       | `string`                | Name of the external bank                                      |
| `status`         | `AccountStatus`         | `ACTIVE` \| `INACTIVE` \| `BUSY`                               |
| `bookCode`       | `string`                | Human-readable ledger page reference                           |
| `createdAt`      | `Date`                  | —                                                              |
| `updatedAt`      | `Date`                  | —                                                              |
| `ownerId`        | `string?` (UUID)        | Admin who created the record                                   |
| `createdBy`      | `string?` (UUID)        | Same as ownerId convention                                     |
| `isDeleted`      | `boolean`               | Soft-delete                                                    |
| `deletedAt`      | `Date?`                 | —                                                              |
| `deletedBy`      | `string?` (UUID)        | —                                                              |
| `accountType`    | `AccountType?`          | Eager-loaded relation                                          |
| `user`           | `User?`                 | Eager-loaded relation (includes `identity.name`)               |
| `balanceSummary` | `AccountBalanceResult?` | Computed live via `JournalBalanceUsecase`; not stored in DB    |

**`AccountStatus` enum**:

- `ACTIVE` — normal operating state
- `INACTIVE` — deactivated; set after a buy-out completes
- `BUSY` — locked during a loan disbursement in progress

#### Domain Entity — `Bank` (Singleton)

**File**: `libs/domain/src/bank/entities/bank.entity.ts`
**Rule**: Exactly one row exists at all times.

| Field                    | Type            | Notes                                                                                |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------ |
| `id`                     | UUID            | PK                                                                                   |
| `name`                   | `string`        | Display name of the platform                                                         |
| `subscriptionFee`        | `Decimal(18,4)` | Monthly fee charged to each active account                                           |
| `commissionPercentage`   | `Decimal(5,2)`  | Default 10%; commission on loans                                                     |
| `defaultMaxInstallments` | `number`        | Default 10                                                                           |
| `installmentOptions`     | `number[]`      | Allowed installment counts, e.g. `[5, 10, 12]`                                       |
| `currency`               | `string`        | Default `"Toman"`                                                                    |
| `timeZone`               | `string`        | Default `"Asia/Tehran"`                                                              |
| `accountId`              | `UUID?`         | The bank's own ledger `Account`; subscription fees and commissions are credited here |
| `isDeleted`              | `boolean`       | Soft-delete                                                                          |

#### Service — `AccountsService`

**File**: `libs/application/src/bank/services/accounts.service.ts`

| Method                               | Description                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; includes `accountType` + `user.identity.name`; attaches `balanceSummary` to each item                                                                                                                                                                                       |
| `findById(id, tx?)`                  | Single account with `accountType`, `user`, and live `balanceSummary`                                                                                                                                                                                                                        |
| `findByUserId(userId, tx?)`          | All accounts for a user (no pagination)                                                                                                                                                                                                                                                     |
| `create(input, tx?)`                 | Validates accountType exists, enforces `maxAccounts`, checks card uniqueness, auto-generates name, then creates **12 months of `SubscriptionFee` rows** starting next month                                                                                                                 |
| `update(id, input, tx?)`             | Partial update of any `UpdateAccountInput` fields                                                                                                                                                                                                                                           |
| `softDelete(id, currentUserId, tx?)` | Marks account as deleted                                                                                                                                                                                                                                                                    |
| `buyOut(id, currentUserId, tx?)`     | Full account settlement: checks no blocking loans, checks no pending WITHDRAWAL, computes balance, checks bank has cash, creates WITHDRAWAL transaction + journal entries (DEBIT `CUSTOMER_DEPOSITS`, CREDIT `CASH`), soft-deletes all non-PAID subscription fees, sets status → `INACTIVE` |
| `activate(id, tx?)`                  | Restores all soft-deleted subscription fees and sets status → `ACTIVE`                                                                                                                                                                                                                      |

#### Service — `AccountTypesService`

**File**: `libs/application/src/bank/services/account-types.service.ts`

| Method                               | Description                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; searchable by `name`, `maxAccounts`                              |
| `findById(id, tx?)`                  | Throws `NotFoundError` if missing                                                |
| `create(input, tx?)`                 | Validates name uniqueness; throws `AccountTypeNameTakenError` (409) if duplicate |
| `update(id, input, tx?)`             | Partial update; throws `NotFoundError` if missing                                |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                                                 |

#### Repository Interfaces

**`AccountRepository`** (`libs/domain/src/bank/repositories/account.repository.ts`):
`findAll`, `findById`, `count`, `create`, `update`, `softDelete`

**`AccountTypeRepository`** (`libs/domain/src/bank/repositories/account-type.repository.ts`):
`findAll`, `findById`, `count`, `create`, `update`, `softDelete`

#### Input / DTO Types

**`CreateAccountInput`** (`libs/domain/src/bank/types/account.type.ts`):
| Field | Validation |
|---|---|
| `accountTypeId` | UUID v4 |
| `userId` | UUID v4 |
| `cardNumber` | exactly 8 digits |
| `bankName` | string, min 3 chars |
| `bookCode` | string |
| `createdAt` | Date |
| `name?` | optional; auto-generated if omitted |

**`UpdateAccountInput`**: all fields optional — `accountTypeId`, `name`, `userId`, `cardNumber`, `bankName`, `status`

**`ListAccountQueryInput`**: extends `PaginationQueryDto` with optional `userId`, `accountTypeId`, `status`

#### Error Types

| Error Class                 | HTTP | Code                      | When thrown                                           |
| --------------------------- | ---- | ------------------------- | ----------------------------------------------------- |
| `AccountTypeNameTakenError` | 409  | `ACCOUNT_TYPE_NAME_TAKEN` | Duplicate `AccountType.name` on create                |
| `BankInvalidAccountError`   | 400  | `BANK_INVALID_ACCOUNT`    | Provided account cannot be used as bank's own account |

#### API Endpoints

**Admin API** (`apps/api-admin/src/bank/accounts.controller.ts`):

| Method   | Path                     | Description                                                        |
| -------- | ------------------------ | ------------------------------------------------------------------ |
| `GET`    | `/accounts`              | Paginated list (filterable by `userId`, `status`, `accountTypeId`) |
| `GET`    | `/accounts/:id`          | Single account with balance summary                                |
| `POST`   | `/accounts`              | Create account                                                     |
| `PATCH`  | `/accounts/:id`          | Update account fields                                              |
| `DELETE` | `/accounts/:id`          | Soft-delete                                                        |
| `POST`   | `/accounts/:id/buy-out`  | Settle and deactivate account                                      |
| `PATCH`  | `/accounts/:id/activate` | Re-activate account after buy-out                                  |

**Admin API** (`apps/api-admin/src/bank/account-types.controller.ts`):

| Method   | Path                 | Description         |
| -------- | -------------------- | ------------------- |
| `GET`    | `/account-types`     | Paginated list      |
| `GET`    | `/account-types/:id` | Single account type |
| `POST`   | `/account-types`     | Create account type |
| `PATCH`  | `/account-types/:id` | Update account type |
| `DELETE` | `/account-types/:id` | Soft-delete         |

**User API** (`apps/api-user/src/account/accounts.controller.ts`):

| Method | Path            | Permission              | Description                                                        |
| ------ | --------------- | ----------------------- | ------------------------------------------------------------------ |
| `GET`  | `/accounts`     | `user/account/findAll`  | Own accounts only (userId forced to current user)                  |
| `GET`  | `/accounts/:id` | `user/account/findById` | Own account only; throws 403 if `account.userId !== currentUserId` |

#### Business Rules

- `cardNumber` must be globally unique across all accounts; duplicate raises `BadRequestException`.
- If `AccountType.maxAccounts` is set, creating a new account of that type fails when the count is already at the limit.
- Account `name` is auto-generated as `"{bankName}-{last4ofCard}"` when not supplied.
- On `create`, **12 future `SubscriptionFee` rows** are created (one per month, starting from the first day of the following month).
- `buyOut` is blocked if account has any PENDING or ACTIVE loans — must fully repay or remove loans first.
- `buyOut` is blocked if account already has a pending WITHDRAWAL transaction.
- `buyOut` with zero balance still deactivates the account and cleans up non-paid fees — no transaction is created.
- Bank must have sufficient cash balance before a buy-out transaction is issued.
- `activate` restores all previously soft-deleted subscription fees (those removed during buy-out).
- Users can only read their own accounts in `api-user`; ownership check is enforced at the controller level.

### 2.5 Loans, LoanType & LoanRequest

#### Domain Entity — `LoanType`

**File**: `libs/domain/src/bank/entities/loan-type.entity.ts`

| Field                  | Type             | Notes                                                                        |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `id`                   | UUID             | PK                                                                           |
| `code`                 | `number`         | Auto-increment display ID                                                    |
| `name`                 | `string`         | Display name of this loan product                                            |
| `commissionPercentage` | `number`         | One-time commission % of loan amount charged at disbursement                 |
| `defaultInstallments`  | `number`         | Suggested installment count shown to users                                   |
| `maxInstallments`      | `number`         | Upper bound for `paymentMonths`                                              |
| `minInstallments`      | `number`         | Lower bound for `paymentMonths`                                              |
| `creditRequirementPct` | `number`         | % of loan amount the member's account balance must cover (eligibility check) |
| `description`          | `string?`        | Optional notes/description                                                   |
| `createdAt`            | `Date`           | —                                                                            |
| `updatedAt`            | `Date`           | —                                                                            |
| `isDeleted`            | `boolean`        | Soft-delete                                                                  |
| `deletedAt`            | `Date?`          | —                                                                            |
| `deletedBy`            | `string?` (UUID) | —                                                                            |

#### Service — `LoanTypesService`

**File**: `libs/application/src/bank/services/loan-types.service.ts`

| Method                               | Description                                                       |
| ------------------------------------ | ----------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; searchable by `name`; supports `isDeleted` filter |
| `findById(id, tx?)`                  | Throws `NotFoundError` if missing                                 |
| `create(input, tx?)`                 | Creates new loan type                                             |
| `update(id, input, tx?)`             | Partial update; throws `NotFoundError` if missing                 |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                                  |

#### Repository — `ILoanTypeRepository`

**File**: `libs/domain/src/bank/repositories/loan-type.repository.ts`

Methods: `findAll`, `findById`, `count`, `create`, `update`, `softDelete`

#### API Endpoints — `LoanTypesController`

**Admin API** (`apps/api-admin/src/bank/loan-types.controller.ts`):

| Method   | Path              | Description      |
| -------- | ----------------- | ---------------- |
| `GET`    | `/loan-types`     | Paginated list   |
| `GET`    | `/loan-types/:id` | Single loan type |
| `POST`   | `/loan-types`     | Create loan type |
| `PATCH`  | `/loan-types/:id` | Update loan type |
| `DELETE` | `/loan-types/:id` | Soft-delete      |

---

#### Domain Entity — `LoanRequest`

**File**: `libs/domain/src/bank/entities/loan-request.entity.ts`

| Field           | Type                | Notes                                                                    |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| `id`            | UUID                | PK                                                                       |
| `code`          | `number`            | Auto-increment display ID                                                |
| `accountId`     | UUID                | FK to `Account` (the member's account requesting the loan)               |
| `account`       | `Account?`          | Eager-loaded                                                             |
| `loanTypeId`    | UUID                | FK to `LoanType`; derived from `DEFAULT_LOAN_TYPE_ID` env on user create |
| `loanType`      | `LoanType?`         | Eager-loaded                                                             |
| `userId`        | UUID                | FK to `User`; derived from `account.userId` on create                    |
| `user`          | `User?`             | Eager-loaded                                                             |
| `amount`        | `string` (Decimal)  | Requested loan amount                                                    |
| `startDate`     | `Date`              | Requested start date for first installment                               |
| `paymentMonths` | `number`            | Number of monthly installments requested                                 |
| `status`        | `LoanRequestStatus` | See lifecycle below                                                      |
| `note`          | `string?`           | Optional applicant/admin note                                            |
| `createdAt`     | `Date`              | —                                                                        |
| `updatedAt`     | `Date`              | —                                                                        |
| `ownerId`       | `string?` (UUID)    | Admin UUID who created the record                                        |
| `createdBy`     | `string?` (UUID)    | Same as `ownerId` convention                                             |
| `isDeleted`     | `boolean`           | Soft-delete                                                              |
| `deletedAt`     | `Date?`             | —                                                                        |
| `deletedBy`     | `string?` (UUID)    | —                                                                        |

**`LoanRequestStatus` enum**:

```
PENDING ──► APPROVED ──► (Loan created, status set to CONVERTED)
    └──────► REJECTED
```

- `PENDING`: submitted, awaiting admin review.
- `APPROVED`: admin approved; a `Loan` is automatically created via `LoansService.create()` and request moves to `CONVERTED`.
- `REJECTED`: admin rejected; no loan created.
- `CONVERTED`: the request has been turned into an active `Loan`. Terminal state — cannot be changed.

#### Service — `LoanRequestsService`

**File**: `libs/application/src/bank/services/loan-requests.service.ts`

| Method                               | Description                                                                                                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; filters by `accountId`, `loanTypeId`, `userId`, `status`, `isDeleted`; includes `loanType{id,name}`, `account` with nested `user.identity.name`, `user.identity`                                                                              |
| `findById(id, tx?)`                  | Full include of `loanType`, `account.user.identity`, `user.identity`; throws `NotFoundError`                                                                                                                                                                  |
| `create(input, tx?)`                 | Resolves `loanTypeId` from `DEFAULT_LOAN_TYPE_ID` env; validates account exists; blocks if account has ACTIVE loan with overlapping `startDate`; enforces `paymentMonths` within `[minInstallments, maxInstallments]`; derives `userId` from `account.userId` |
| `update(id, input, tx?)`             | Partial update of `status`, `note`                                                                                                                                                                                                                            |
| `updateStatus(id, status, tx?)`      | Thin wrapper around `update` for status-only changes                                                                                                                                                                                                          |
| `approve(id, tx?)`                   | Guards: must be PENDING; calls `LoansService.create()` then sets status → APPROVED                                                                                                                                                                            |
| `reject(id, tx?)`                    | Guards: must be PENDING or APPROVED; sets status → REJECTED; idempotent if already REJECTED                                                                                                                                                                   |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                                                                                                                                                                                                                              |
| `restore(id, tx?)`                   | Restores soft-deleted request                                                                                                                                                                                                                                 |

#### Repository — `ILoanRequestRepository`

**File**: `libs/domain/src/bank/repositories/loan-request.repository.ts`

Methods: `findAll`, `findOne`, `findById`, `count`, `create`, `update`, `softDelete`, `restore`

#### API Endpoints — `LoanRequestsController`

**Admin API** (`apps/api-admin/src/bank/loan-requests.controller.ts`):

| Method   | Path                         | Description                                                                  |
| -------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `POST`   | `/loan-requests`             | Create a new loan request                                                    |
| `GET`    | `/loan-requests`             | Paginated list (filterable by `userId`, `accountId`, `status`, `loanTypeId`) |
| `GET`    | `/loan-requests/:id`         | Single loan request (full include)                                           |
| `POST`   | `/loan-requests/:id/approve` | Approve request → auto-creates Loan                                          |
| `POST`   | `/loan-requests/:id/reject`  | Reject request                                                               |
| `PATCH`  | `/loan-requests/:id/status`  | Manually set status via `ReviewLoanRequestDto`                               |
| `PATCH`  | `/loan-requests/:id`         | Update `note` field                                                          |
| `DELETE` | `/loan-requests/:id`         | Soft-delete                                                                  |
| `POST`   | `/loan-requests/:id/restore` | Restore soft-deleted request                                                 |

**User API** (`apps/api-user/src/loan-request/loan-requests.controller.ts`):

| Method | Path                 | Description                                                            |
| ------ | -------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/loan-requests`     | Own requests only (`userId` forced to current user)                    |
| `GET`  | `/loan-requests/:id` | Own request only; throws 403 if `loanRequest.userId !== currentUserId` |
| `POST` | `/loan-requests`     | Submit a new loan request                                              |

---

#### Domain Entity — `Loan`

**File**: `libs/domain/src/bank/entities/loan.entity.ts`

| Field                | Type                  | Notes                                                                           |
| -------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `id`                 | UUID                  | PK                                                                              |
| `code`               | `number`              | Auto-increment display ID                                                       |
| `name`               | `string`              | Auto-set to `"Loan for request {loanRequest.code}"` when created from a request |
| `userId`             | UUID                  | FK to `User` (account owner); set from `account.userId` at create               |
| `user`               | `User?`               | Eager-loaded                                                                    |
| `accountId`          | UUID                  | FK to `Account`                                                                 |
| `account`            | `Account?`            | Eager-loaded                                                                    |
| `loanTypeId`         | UUID                  | FK to `LoanType`                                                                |
| `loanType`           | `LoanType?`           | Eager-loaded                                                                    |
| `amount`             | `string` (Decimal)    | Full loan face amount (before commission deduction)                             |
| `startDate`          | `Date`                | First installment reference date                                                |
| `paymentMonths`      | `number`              | Total installment count                                                         |
| `status`             | `LoanStatus`          | `PENDING` \| `ACTIVE` \| `PAID`                                                 |
| `balanceSummary`     | `LoanBalanceResult?`  | Computed live via `JournalBalanceUsecase`; not stored                           |
| `installmentSummary` | `InstallmentSummary?` | Computed live; attached on every `findAll`/`findById`                           |
| `createdAt`          | `Date`                | —                                                                               |
| `updatedAt`          | `Date`                | —                                                                               |
| `ownerId`            | `string?` (UUID)      | Admin who created the record                                                    |
| `createdBy`          | `string?` (UUID)      | Same as `ownerId`                                                               |
| `isDeleted`          | `boolean`             | Soft-delete                                                                     |
| `deletedAt`          | `Date?`               | —                                                                               |
| `deletedBy`          | `string?` (UUID)      | —                                                                               |

**`LoanStatus` enum**:

```
PENDING ──► ACTIVE ──► PAID
```

- `PENDING`: loan record created, disbursement transaction exists but not yet approved.
- `ACTIVE`: admin approved the transaction → journal posted → installments activated → account set to `BUSY`.
- `PAID`: all installments PAID (set externally via allocation flow).

#### `InstallmentSummary` Type

**File**: `libs/domain/src/bank/types/loan.type.ts`

| Field                    | Type      | Notes                                          |
| ------------------------ | --------- | ---------------------------------------------- |
| `totalCount`             | `number`  | Total installments for this loan               |
| `paidCount`              | `number`  | Count with status PAID                         |
| `overdueCount`           | `number`  | Count past due date and not paid               |
| `activeCount`            | `number`  | Count with status ACTIVE                       |
| `pendingCount`           | `number`  | Count with status PENDING                      |
| `totalAmount`            | `number`  | Sum of all installment amounts                 |
| `amountPaid`             | `number`  | Sum of paid installments                       |
| `amountOverdue`          | `number`  | Sum of overdue installments                    |
| `amountRemaining`        | `number`  | `totalAmount - amountPaid`                     |
| `paymentPercentage`      | `number`  | `amountPaid / totalAmount * 100`               |
| `expectedCompletionDate` | `Date?`   | Due date of last installment                   |
| `nextInstallmentDate`    | `Date?`   | Due date of next unpaid installment            |
| `nextInstallmentAmount`  | `number?` | Amount of next unpaid installment              |
| `nextInstallmentNumber`  | `number?` | `installmentNumber` of next unpaid installment |

#### Service — `LoansService`

**File**: `libs/application/src/bank/services/loans.service.ts`

| Method                               | Description                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; filters by `accountId`, `loanTypeId`, `userId` (via `account.userId`), `status`, `isDeleted`; includes `loanType{id,name}`, nested `account.user.identity.name`; attaches `installmentSummary` to every item |
| `findById(id, tx?)`                  | Full include + `installmentSummary` + `balanceSummary`; throws `NotFoundError`                                                                                                                                               |
| `create(input, tx?)`                 | Full creation flow (see below); all steps in one DB transaction                                                                                                                                                              |
| `update(id, input, tx?)`             | Partial update of `name`, `status`; throws `NotFoundError`                                                                                                                                                                   |
| `approve(id, tx?)`                   | Approves pending loan — see approval flow below                                                                                                                                                                              |
| `softDelete(id, currentUserId, tx?)` | Only PENDING loans can be deleted; also rejects the associated transaction                                                                                                                                                   |

**`create` flow (all within a single DB transaction)**:

1. Validate `loanTypeId` exists — `NotFoundError` if not.
2. Validate `accountId` exists (via `AccountsService.findById`) — `NotFoundError` if not; account includes `balanceSummary`.
3. Validate account owner is `ACTIVE` user — `BadRequestException` otherwise.
4. Validate `paymentMonths` is within `[loanType.minInstallments, loanType.maxInstallments]` — `BadRequestException` otherwise.
5. Validate `account.balanceSummary.totalDeposits >= amount × creditRequirementPct / 100` — `BadRequestException` if insufficient.
6. Check bank has sufficient funds via `BankFinancialsService.canApproveLoan(amount)` — `BadRequestException` if not.
7. Check no existing ACTIVE loans on the same account — `ConflictException` if found.
8. Create the `Loan` record (status: `PENDING`).
9. Calculate financials: `commissionAmount = floor(commissionPercentage / 100 × amount)`, `netDisbursement = amount - commissionAmount`.
10. Create a `LOAN_DISBURSEMENT` transaction (status: `PENDING`) with 3 journal entries:
    - DEBIT `LOANS_RECEIVABLE` for full `amount` (targetType: LOAN, targetId: loan.id)
    - CREDIT `CASH` for `netDisbursement`
    - CREDIT `FEE_COMMISSION_INCOME` for `commissionAmount`
11. Generate installment schedule (see below).

**Installment scheduling logic**:

- `installmentAmount = floor(amount / paymentMonths)` (integer division via BigInt).
- For each installment `i` (0-based): compute `dueDate = startOfMonth(addMonths(startDate, offset))`.
- Offset: if the Persian calendar day of `startDate` is **> 15**, use `i + 2`, else `i + 1`.
- Each installment created with status `PENDING`.

**`approve` flow (all within a single DB transaction)**:

1. Fetch loan; return early if already `ACTIVE`.
2. Find associated transaction via JournalEntry → Journal → Transaction chain.
3. Call `TransactionsService.approve(transaction.id)` → posts the journal automatically.
4. Update loan status → `ACTIVE`.
5. Activate all installments for the loan (status: PENDING → ACTIVE).
6. Set account status → `BUSY`.
7. Emit `loan.approved` event (`LoanApprovedEvent`).

**`softDelete` flow**:

- Only loans in `PENDING` status can be deleted — `ConflictException` otherwise.
- Finds journal entries for the loan → gets journalId → gets transactionId.
- Calls `TransactionsService.reject(transactionId)` to roll back the transaction.
- Soft-deletes the loan record.

#### Repository — `ILoanRepository`

**File**: `libs/domain/src/bank/repositories/loan.repository.ts`

Methods: `findAll`, `findOne`, `count`, `create`, `update`, `softDelete`

#### Input / DTO Types

**`CreateLoanInput`** (`libs/domain/src/bank/types/loan.type.ts`):
| Field | Notes |
|---|---|
| `name` | Loan display name |
| `accountId` | UUID of the member account |
| `loanTypeId` | UUID of the LoanType |
| `amount` | Loan face amount (string/Decimal) |
| `startDate` | First installment reference date |
| `paymentMonths` | Number of installments |
| `status?` | Optional override; defaults to PENDING |

**`UpdateLoanInput`**: partial pick of `name`, `status`

**`ListLoanQueryInput`**: extends `BaseQueryParams` with optional `accountId`, `userId`, `loanTypeId`, `status`

**`CreateLoanRequestInput`**:
| Field | Notes |
|---|---|
| `accountId` | UUID of the member account |
| `loanTypeId` | Resolved from `DEFAULT_LOAN_TYPE_ID` env (not user-supplied) |
| `userId` | Derived from `account.userId` (not user-supplied) |
| `amount` | Requested amount |
| `startDate` | Requested start date |
| `paymentMonths` | Requested installment count |
| `note?` | Optional note |

**`UpdateLoanRequestInput`**: partial pick of `status`, `note`

**`ListLoanRequestQueryInput`**: extends `BaseQueryParams` with optional `accountId`, `userId`, `loanTypeId`, `status`

**`CreateLoanTypeInput`**: picks `name`, `commissionPercentage`, `defaultInstallments`, `maxInstallments`, `minInstallments`, `creditRequirementPct`, `description`

**`UpdateLoanTypeInput`**: all `LoanType` fields partial (omits `id`, `createdAt`, `updatedAt`)

#### API Endpoints — `LoansController`

**Admin API** (`apps/api-admin/src/bank/loans.controller.ts`):

| Method   | Path                 | Description                                        |
| -------- | -------------------- | -------------------------------------------------- |
| `GET`    | `/loans`             | Paginated list with `installmentSummary` per loan  |
| `GET`    | `/loans/:id`         | Single loan with full include                      |
| `POST`   | `/loans`             | Create loan (full disbursement flow)               |
| `PATCH`  | `/loans/:id`         | Update `name` or `status`                          |
| `POST`   | `/loans/approve/:id` | Approve loan → activate installments, post journal |
| `DELETE` | `/loans/:id`         | Soft-delete (PENDING only)                         |

**User API** (`apps/api-user/src/loans/loans.controller.ts`):

| Method | Path         | Description                                                  |
| ------ | ------------ | ------------------------------------------------------------ |
| `GET`  | `/loans`     | Own loans only (`userId` forced to current user)             |
| `GET`  | `/loans/:id` | Own loan only; throws 403 if `loan.userId !== currentUserId` |

#### Business Rules

- A `LoanRequest` is always created with `loanTypeId` resolved from the `DEFAULT_LOAN_TYPE_ID` environment variable — users do not pick a loan type directly.
- A new loan request is blocked if the account already has an ACTIVE loan whose last installment date overlaps with the requested `startDate`.
- `paymentMonths` must fall within `[loanType.minInstallments, loanType.maxInstallments]`.
- `account.balanceSummary.totalDeposits` must be ≥ `amount × creditRequirementPct / 100` before a loan can be created.
- The bank's available cash is checked before disbursement (`BankFinancialsService.canApproveLoan`).
- No two ACTIVE loans may exist on the same account simultaneously — `ConflictException` on conflict.
- Commission is deducted from disbursement: member receives `netDisbursement = amount − commissionAmount`; the full `amount` is recorded as `LOANS_RECEIVABLE`.
- Installment due dates use the **Persian (Jalali) calendar**: if the start day is after the 15th, the first installment is scheduled 2 months out; otherwise 1 month out.
- Approving a loan requires an associated `LOAN_DISBURSEMENT` transaction; without it, `BadRequestException` is thrown.
- Only `PENDING` loans can be soft-deleted; deleting a loan also rejects its disbursement transaction.
- Users can only view their own loans and loan requests in `api-user`; ownership checks are enforced at the controller level.

### 2.6 Subscription Fees

#### Domain Entity — `SubscriptionFee`

**File**: `libs/domain/src/bank/entities/subscription-fee.entity.ts`

| Field            | Type                    | Notes                                                              |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| `id`             | UUID                    | PK                                                                 |
| `code`           | `number`                | Auto-increment display ID                                          |
| `accountId`      | UUID                    | FK to `Account` (the member account being charged)                 |
| `journalEntryId` | `string?` (UUID)        | FK to `JournalEntry`; set when fee is allocated to a journal entry |
| `periodStart`    | `Date`                  | First day of the billing month (unique per `accountId`)            |
| `amount`         | `string` (Decimal)      | Fee amount; sourced from `Bank.subscriptionFee` at creation time   |
| `status`         | `SubscriptionFeeStatus` | See lifecycle below                                                |
| `dueDate`        | `Date?`                 | Optional explicit due date                                         |
| `paidAt`         | `Date?`                 | Timestamp when status moved to PAID                                |
| `createdAt`      | `Date`                  | —                                                                  |
| `updatedAt`      | `Date`                  | —                                                                  |
| `ownerId`        | `string?` (UUID)        | Admin who created the record                                       |
| `createdBy`      | `string?` (UUID)        | Same as `ownerId` convention                                       |
| `account`        | `Account?`              | Eager-loaded relation                                              |
| `journalEntry`   | `JournalEntry?`         | Eager-loaded when `journalEntryId` is set                          |
| `isDeleted`      | `boolean`               | Soft-delete                                                        |
| `deletedAt`      | `Date?`                 | —                                                                  |
| `deletedBy`      | `string?` (UUID)        | —                                                                  |

**`SubscriptionFeeStatus` lifecycle**:

```
DUE ──► ALLOCATED ──► PAID
```

- `DUE`: fee has been generated and is outstanding.
- `ALLOCATED`: a journal entry has been created crediting this fee (allocation flow); intermediate state.
- `PAID`: the associated transaction has been approved and the journal posted; `paidAt` is set.

#### Service — `SubscriptionFeesService`

**File**: `libs/application/src/bank/services/subscription-fees.service.ts`

| Method                               | Description                                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`               | Paginated list; filterable by `accountId`, `userId` (via account relation), `status`, `periodStart`, `isDeleted`; default order: `periodStart` ASC |
| `findById(id, tx?)`                  | Throws `NotFoundError` if missing                                                                                                                  |
| `create(input, tx?)`                 | Validates account exists; sets `amount` from `Bank.subscriptionFee`; status defaults to `DUE`                                                      |
| `update(id, input, tx?)`             | Partial update of `periodStart`, `amount`, `dueDate`, `paidAt`, `status`, `journalEntryId`                                                         |
| `softDelete(id, currentUserId, tx?)` | Marks as deleted                                                                                                                                   |
| `createNext(input, tx?)`             | Generates `numberOfMonths` consecutive monthly fees — see flow below                                                                               |

**`createNext` flow**:

1. Find the most recent fee for the account (ordered by `periodStart` DESC, limit 1).
2. If no existing fee, start from `startOfMonth(now)`; otherwise start from `startOfMonth(lastPeriodStart + 1 month)`.
3. For each month `i` (0-based): compute `periodStart = startOfMonth(nextPeriodStart + i months)` and call `create({ accountId, periodStart })`.
4. Returns array of created `SubscriptionFee` records.

**Integration points**:

- On **account create**: 12 months of fees are created upfront (called in `AccountsService.create`).
- On **transaction approve**: when a fee is paid, `createNext({ accountId, numberOfMonths: 1 })` is called to keep the fee schedule rolling (called in `TransactionsService.approve`).
- On **account buy-out**: all non-PAID fees for the account are soft-deleted (called in `AccountsService.buyOut`).
- On **account activate**: soft-deleted fees are restored via `SubscriptionFeeRepository.restoreManyByAccountId` (called in `AccountsService.activate`).

#### Repository — `SubscriptionFeeRepository`

**File**: `libs/domain/src/bank/repositories/subscription-fee.repository.ts`

Methods: `findAll`, `findById`, `count`, `create`, `update`, `softDelete`, `softDeleteMany?`, `restoreManyByAccountId`

#### Input / DTO Types

**`CreateSubscriptionFeeInput`**: `{ accountId: UUID, periodStart: Date }`

**`UpdateSubscriptionFeeInput`**: all optional — `periodStart`, `amount`, `dueDate`, `paidAt`, `status`, `journalEntryId`

**`CreateNextSubscriptionFeeInput`**: `{ accountId: UUID, numberOfMonths: number }`

**`ListSubscriptionFeeQueryInput`**: extends `BaseQueryParams` with optional `accountId`, `userId`, `status`, `periodStart`

#### API Endpoints

**Admin API** (`apps/api-admin/src/bank/subscription-fees.controller.ts`):

| Method   | Path                                          | Description                                                                  |
| -------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET`    | `/subscription-fees`                          | Paginated list; filterable by `accountId`, `userId`, `status`, `periodStart` |
| `GET`    | `/subscription-fees/:id`                      | Single subscription fee                                                      |
| `POST`   | `/subscription-fees`                          | Create a single fee row                                                      |
| `POST`   | `/subscription-fees/accounts/:accountId/next` | Generate next N monthly fees for an account                                  |
| `PATCH`  | `/subscription-fees/:id`                      | Update fee fields (`status`, `amount`, `dueDate`, etc.)                      |
| `DELETE` | `/subscription-fees/:id`                      | Soft-delete                                                                  |

#### Business Rules

- `(accountId, periodStart)` is effectively unique — creating a duplicate will fail at the DB level.
- The `amount` is always read from `Bank.subscriptionFee` at the time of creation — changing the bank setting does not retroactively affect existing fees.
- Only non-PAID fees are soft-deleted during a buy-out; PAID fees are preserved for historical accuracy.
- `createNext` is idempotent in the sense that it always continues from the last known `periodStart`; calling it twice in a row creates two consecutive months.
- Fees are soft-deletable by admins for correction purposes; the `restoreManyByAccountId` method is used exclusively by `AccountsService.activate` to restore all fees when an account is reactivated.

### 2.7 Transactions

#### Domain Entity — `Transaction`

**File**: `libs/domain/src/transaction/entities/transaction.entity.ts`

| Field         | Type                 | Notes                                                                               |
| ------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `id`          | UUID                 | PK                                                                                  |
| `code`        | `number`             | Auto-increment display ID                                                           |
| `kind`        | `TransactionKind`    | See enum below                                                                      |
| `amount`      | `string` (Decimal)   | Transaction amount; Decimal(18,4)                                                   |
| `status`      | `TransactionStatus`  | See lifecycle below                                                                 |
| `externalRef` | `string?`            | Optional external reference (e.g., bank transfer ID); globally unique when provided |
| `note`        | `string?`            | Optional free-text note                                                             |
| `userId`      | UUID                 | FK to `User` — the member associated with this transaction                          |
| `createdAt`   | `Date`               | —                                                                                   |
| `updatedAt`   | `Date`               | —                                                                                   |
| `ownerId`     | `string?` (UUID)     | Admin who created the record                                                        |
| `createdBy`   | `string?` (UUID)     | Same as `ownerId` convention                                                        |
| `user`        | `User?`              | Eager-loaded relation including `identity.name`                                     |
| `images`      | `TransactionImage[]` | Attached receipt/cheque images                                                      |
| `isDeleted`   | `boolean`            | Soft-delete                                                                         |
| `deletedAt`   | `Date?`              | —                                                                                   |
| `deletedBy`   | `string?` (UUID)     | —                                                                                   |

**`TransactionKind` enum**:

- `DEPOSIT` — cash coming in from a member (classified as "cash-in" by `TransactionKindHelper`)
- `WITHDRAWAL` — cash going out (buy-out payout; classified as "cash-out")
- `LOAN_DISBURSEMENT` — loan funds sent to member (cash-out)
- `TRANSFER` — internal transfer between two member accounts (immediately APPROVED; no manual approval step)

**`TransactionStatus` lifecycle**:

```
PENDING ──► APPROVED
   └──────► REJECTED
APPROVED ──► ALLOCATED   (via journal allocation flow)
```

- `PENDING`: newly created; journal is PENDING, not yet posted.
- `APPROVED`: admin approved; journal posted to ledger; installments/fees in linked entries move to PAID.
- `REJECTED`: admin rejected; transaction soft-deleted; journal VOIDED; linked installments reverted to ACTIVE, linked fees reverted to DUE.
- `ALLOCATED`: all journal entries for this transaction have been fully matched against targets (set automatically after allocation flow completes).
- **TRANSFER** transactions bypass the approval step — they are created with status `APPROVED` and journal immediately `POSTED`.

**`TransactionKindHelper`** (`libs/domain/src/transaction/helpers/transaction-kind.helper.ts`):

- `isCashIn(kind)` → `true` only for `DEPOSIT`
- `isCashOut(kind)` → `true` for everything else (WITHDRAWAL, LOAN_DISBURSEMENT, TRANSFER)

#### Domain Entity — `TransactionImage`

**File**: `libs/domain/src/transaction/entities/transaction-image.entity.ts`

| Field           | Type             | Notes                                     |
| --------------- | ---------------- | ----------------------------------------- |
| `id`            | UUID             | PK                                        |
| `transactionId` | UUID             | FK to `Transaction`                       |
| `fileId`        | UUID             | FK to `File` (stores URL, mimeType, size) |
| `description`   | `string?`        | Optional caption                          |
| `createdAt`     | `Date`           | —                                         |
| `ownerId`       | `string?` (UUID) | —                                         |
| `createdBy`     | `string?` (UUID) | —                                         |
| `isDeleted`     | `boolean`        | Soft-delete                               |
| `deletedAt`     | `Date?`          | —                                         |
| `deletedBy`     | `string?` (UUID) | —                                         |

#### Auto-Created Journal Entries on `create`

When a transaction is created, `TransactionsService.create()` automatically builds a balanced journal via `CreateJournalWithEntriesUseCase`:

| Kind                                          | DEBIT account                    | CREDIT account              |
| --------------------------------------------- | -------------------------------- | --------------------------- |
| `DEPOSIT` (cash-in)                           | `CASH (1000)`                    | `UNAPPLIED_RECEIPTS (2050)` |
| `WITHDRAWAL` / `LOAN_DISBURSEMENT` (cash-out) | `UNAPPLIED_DISBURSEMENTS (2100)` | `CASH (1000)`               |

For `TRANSFER`, the journal is created directly in `createTransferTransaction` with status `POSTED`:

| Entry               | DEBIT/CREDIT | Account                    | Notes                                                    |
| ------------------- | ------------ | -------------------------- | -------------------------------------------------------- |
| Source account      | DEBIT        | `CUSTOMER_DEPOSITS (2000)` | `targetType: ACCOUNT`, `targetId: sourceAccount.id`      |
| Destination account | CREDIT       | `CUSTOMER_DEPOSITS (2000)` | `targetType: ACCOUNT`, `targetId: destinationAccount.id` |

#### Service — `TransactionsService`

**File**: `libs/application/src/transaction/services/transactions.service.ts`

| Method                                                      | Description                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`                                      | Paginated list; filters: `userId`, `kind`, `status`, `isDeleted`, `accountId` (via journal entry), `targetType`, `targetId`; searchable by `externalRef`, `note`; default order: `createdAt` desc; includes `user.identity.name` |
| `findById(id, tx?)`                                         | Single transaction with all relations (user + images); throws `NotFoundError` if missing                                                                                                                                         |
| `create(input, tx?)`                                        | Validates user ACTIVE, checks `externalRef` uniqueness, creates Transaction (PENDING), auto-creates balanced PENDING journal                                                                                                     |
| `createTransferTransaction(input, userId?, tx?)`            | Internal transfer between two member accounts — see flow below                                                                                                                                                                   |
| `createSpecificTransaction(input, tx?)`                     | Generic creation with caller-supplied `JournalEntrySpec[]` array; used internally by other services (e.g., loan disbursement)                                                                                                    |
| `addEntriesToTransaction(transactionId, newEntries[], tx?)` | Appends additional journal entries to a PENDING transaction's journal; validates journal remains balanced after additions                                                                                                        |
| `approve(id, tx?)`                                          | Posts journal, moves dependent installments/fees to PAID — see approval flow below                                                                                                                                               |
| `update(id, input, tx?)`                                    | Partial update of any transaction field; throws `NotFoundError` if missing                                                                                                                                                       |
| `softDelete(id, currentUserId, tx?)`                        | Soft-deletes associated image files (via `FilesService`) then soft-deletes the transaction record                                                                                                                                |
| `reject(id, currentUserId, tx?)`                            | Rejects and rolls back — see rejection flow below                                                                                                                                                                                |

**`create` flow**:

1. Validate user exists and is `ACTIVE` — `NotFoundError` otherwise.
2. If `externalRef` provided, check uniqueness — `ConflictException` if duplicate.
3. Create `Transaction` record (status: `PENDING`).
4. Build journal entry specs from `TransactionKindHelper` (DEPOSIT → cash-in template; others → cash-out template).
5. Execute `CreateJournalWithEntriesUseCase` — creates a PENDING journal with two balanced entries.

**`createTransferTransaction` flow**:

1. If `userId` provided, validate user is `ACTIVE`.
2. Fetch source and destination accounts (must not be `INACTIVE`) — `NotFoundError` if inactive or missing.
3. Validate source account balance ≥ transfer amount — `ConflictException` if insufficient.
4. Create `TRANSFER` transaction with status `APPROVED`.
5. Create a POSTED journal immediately (no approval step needed).
6. Create two journal entries on `CUSTOMER_DEPOSITS (2000)`: DEBIT source account, CREDIT destination account.

**`approve` flow**:

1. Fetch transaction; throw `NotFoundError` if missing.
2. Fetch single journal for this transaction with entries; validate:
   - Journal has ≥ 1 entry — `ConflictException` otherwise.
   - Journal status is `PENDING` — `ConflictException` otherwise.
   - Total DEBIT = total CREDIT (4 d.p.) — `ConflictException` if unbalanced.
3. Update transaction status → `APPROVED`.
4. Update journal status → `POSTED`, set `postedAt = now()`.
5. Mark all journal entries as `removable: false`.
6. For each journal entry with `targetType = INSTALLMENT`:
   - Update installment → status `PAID`, set `paymentDate`, set `journalEntryId`.
   - Count remaining non-PAID installments for the loan.
   - If zero remain → update Loan → `PAID`, update Account → `ACTIVE`.
7. For each journal entry with `targetType = SUBSCRIPTION_FEE`:
   - Update subscription fee → status `PAID`, set `paidAt`, set `journalEntryId`.
   - Call `SubscriptionFeesService.createNext({ accountId, numberOfMonths: 1 })` to generate next month's fee.

**`reject` flow** (also called by admin `DELETE /transactions/:id`):

1. Fetch transaction; throw `NotFoundError` if missing.
2. Fetch single journal; validate journal is `PENDING` — `ConflictException` if not.
3. Update transaction status → `REJECTED`.
4. Soft-delete the transaction record.
5. Void the journal (`JournalsService.void()`).
6. For each journal entry with `targetType = INSTALLMENT`: revert installment → `ACTIVE`.
7. For each journal entry with `targetType = SUBSCRIPTION_FEE`: revert fee → `DUE`, clear `paidAt` and `journalEntryId`.

#### Service — `TransactionImagesService`

**File**: `libs/application/src/transaction/services/transaction-images.service.ts`

| Method                                             | Description                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `create(transactionId, fileId, description?, tx?)` | Creates a `TransactionImage` record linking the transaction to an uploaded file                       |
| `findAll(options?, tx?)`                           | Raw find-all forwarding to repository                                                                 |
| `softDelete(id, currentUserId, tx?)`               | Fetches image, calls `FilesService.softDelete` on the linked file, then hard-deletes the image record |

#### Repository Interfaces

**`TransactionRepository`** (`libs/domain/src/transaction/repositories/transaction.repository.ts`):
`findAll`, `findById`, `findByIdWithRelations`, `count`, `create`, `update`, `softDelete`

**`TransactionImageRepository`** (`libs/domain/src/transaction/repositories/transaction-image.repository.ts`):
`findAll`, `findById`, `count`, `create`, `update`, `delete` (hard delete)

#### Input / DTO Types

**`CreateTransactionInput`** (`libs/domain/src/transaction/types/transaction.type.ts`):
| Field | Notes |
|---|---|
| `userId` | UUID of the associated member |
| `kind` | `TransactionKind` enum |
| `amount` | String decimal |
| `externalRef?` | Optional; globally unique |
| `note?` | Optional description |
| `status` | Initial status (always `PENDING` from controllers) |

**`CreateTransactionDto`** (`apps/api-admin/src/transactions/dtos/transactions/create-transaction.dto.ts`):
`userId` (UUID), `kind` (enum), `amount` (decimal string, 0–4 d.p.), `externalRef?` (max 255), `note?` (max 1000)

**`CreateTransferTransactionDto`**:
`sourceAccountId` (UUID), `destinationAccountId` (UUID), `amount` (decimal string), `description?` (max 500)

**`UpdateTransactionDto`**: all fields optional (`PartialType` of `CreateTransactionDto`)

**`GetTransactionsQueryDto`**: extends `PaginationQueryDto` with `userId?`, `accountId?`, `targetType?` (`JournalEntryTarget`), `status?`, `kind?`

**`CreateTransactionWithJournalEntriesInput`**: `CreateTransactionInput` + `journalEntries: JournalEntrySpec[]` — used by `createSpecificTransaction` for custom journal wiring

**`CreateTransferTransactionInput`**: `sourceAccountId`, `destinationAccountId`, `amount`, `description?`

#### API Endpoints

**Admin API** (`apps/api-admin/src/transactions/transactions.controller.ts`):

| Method   | Path                        | Permission                         | Description                                                                         |
| -------- | --------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `GET`    | `/transactions`             | `admin/transaction/findAll`        | Paginated list; filterable by `userId`, `kind`, `status`, `accountId`, `targetType` |
| `GET`    | `/transactions/:id`         | `admin/transaction/findById`       | Single transaction with images and user                                             |
| `POST`   | `/transactions`             | `admin/transaction/create`         | Create transaction (PENDING); optional image upload via multipart                   |
| `POST`   | `/transactions/transfer`    | `admin/transaction/createTransfer` | Internal account-to-account transfer (immediately APPROVED)                         |
| `POST`   | `/transactions/approve/:id` | `admin/transaction/approve`        | Approve transaction → post journal, mark installments/fees PAID                     |
| `POST`   | `/transactions/reject/:id`  | `admin/transaction/reject`         | Reject transaction → void journal, revert installments/fees                         |
| `PATCH`  | `/transactions/:id`         | `admin/transaction/update`         | Partial update of transaction fields                                                |
| `DELETE` | `/transactions/:id`         | `admin/transaction/softDelete`     | Calls `reject()` internally — not a plain soft-delete                               |

**User API** (`apps/api-user/src/transaction/transactions.controller.ts`):

| Method | Path                | Permission                  | Description                                                                |
| ------ | ------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `GET`  | `/transactions`     | `user/transaction/findAll`  | Own transactions only (`userId` forced to `currentUserId`)                 |
| `GET`  | `/transactions/:id` | `user/transaction/findById` | Own transaction only; throws 403 if `transaction.userId !== currentUserId` |
| `POST` | `/transactions`     | `user/transaction/create`   | Submit a deposit request (with optional receipt image)                     |

#### Business Rules

- `externalRef` must be globally unique across non-deleted transactions — `ConflictException` on duplicate.
- Only `ACTIVE` users can be associated with a transaction — `NotFoundError` if user is inactive or missing.
- A transaction image upload creates a `File` record first via `FilesService`, then links it via `TransactionImage`.
- `DELETE /transactions/:id` (admin) calls `reject()`, not a plain soft-delete — it voids the journal and reverts all linked entities.
- `TRANSFER` transactions are created already-APPROVED with immediately-POSTED journals; they cannot be rejected or approved again.
- Approving a transaction is blocked if: the journal has no entries, the journal is not PENDING, or total DEBITs ≠ total CREDITs (checked at 4 d.p.).
- When all installments of a loan reach `PAID` status (triggered during approval), the `Loan.status` automatically moves to `PAID` and `Account.status` reverts to `ACTIVE`.
- When a subscription fee is paid (triggered during approval), the next month's fee row is automatically created via `SubscriptionFeesService.createNext`.
- Rejecting a transaction reverts any linked installments from `ALLOCATED` → `ACTIVE` and subscription fees from `ALLOCATED` → `DUE`.
- `addEntriesToTransaction` can only add entries to a PENDING transaction with a PENDING journal; it re-validates balance after each addition.
- Users can only read and create their own transactions in `api-user`; the ownership check is enforced at the controller level using `currentUserId`.

### 2.8 Ledger (Double-Entry Accounting)

#### Domain Entity — `LedgerAccount`

**File**: `libs/domain/src/ledger/entities/ledger-account.entity.ts`

| Field       | Type                  | Notes                                                                                             |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `id`        | UUID                  | PK                                                                                                |
| `code`      | `string`              | Unique string code (e.g., `"1000"`, `"2000"`) — used as canonical reference throughout the system |
| `name`      | `string`              | English display name                                                                              |
| `nameFa`    | `string?`             | Persian display name                                                                              |
| `type`      | `LedgerAccountType`   | `ASSET` \| `LIABILITY` \| `EQUITY` \| `INCOME` \| `EXPENSE`                                       |
| `status`    | `LedgerAccountStatus` | `ACTIVE` \| `INACTIVE`                                                                            |
| `createdAt` | `Date`                | —                                                                                                 |
| `updatedAt` | `Date`                | —                                                                                                 |
| `isDeleted` | `boolean`             | Soft-delete                                                                                       |
| `deletedAt` | `Date?`               | —                                                                                                 |
| `deletedBy` | `string?` (UUID)      | —                                                                                                 |

#### `LEDGER_ACCOUNT_CODES` Constant

**File**: `libs/domain/src/ledger/constants/ledger-account-codes.ts`

| Code   | Key                        | Type      | Description                       |
| ------ | -------------------------- | --------- | --------------------------------- |
| `1000` | `CASH`                     | ASSET     | Bank's cash on hand               |
| `1100` | `LOANS_RECEIVABLE`         | ASSET     | Outstanding loan principal        |
| `2000` | `CUSTOMER_DEPOSITS`        | LIABILITY | Pooled member deposits            |
| `2050` | `UNAPPLIED_RECEIPTS`       | LIABILITY | Unallocated incoming payments     |
| `2100` | `UNAPPLIED_DISBURSEMENTS`  | LIABILITY | Unallocated outgoing payments     |
| `4100` | `FEE_COMMISSION_INCOME`    | INCOME    | Commission on loans               |
| `4200` | `SUBSCRIPTION_FEE_INCOME`  | INCOME    | Monthly subscription fees         |
| `5100` | `LOAN_REPAYMENT_EXPENSE`   | EXPENSE   | Loan repayment cost tracking      |
| `5200` | `COMMISSION_EXPENSE`       | EXPENSE   | Commission expense tracking       |
| `5300` | `SUBSCRIPTION_FEE_EXPENSE` | EXPENSE   | Subscription fee expense tracking |

#### Domain Entity — `Journal`

**File**: `libs/domain/src/ledger/entities/journal.entity.ts`

| Field           | Type              | Notes                                                    |
| --------------- | ----------------- | -------------------------------------------------------- |
| `id`            | UUID              | PK                                                       |
| `code`          | `number`          | Auto-increment display ID                                |
| `transactionId` | `string?` (UUID)  | Optional FK to `Transaction` that triggered this journal |
| `postedAt`      | `Date?`           | Set when status transitions to POSTED                    |
| `note`          | `string?`         | Optional description                                     |
| `status`        | `JournalStatus`   | `PENDING` \| `POSTED` \| `VOIDED`                        |
| `createdAt`     | `Date`            | —                                                        |
| `updatedAt`     | `Date`            | —                                                        |
| `transaction`   | `Transaction?`    | Eager-loaded                                             |
| `entries`       | `JournalEntry[]?` | Eager-loaded when requested via `includeEntries`         |
| `isDeleted`     | `boolean`         | Soft-delete                                              |
| `deletedAt`     | `Date?`           | —                                                        |
| `deletedBy`     | `string?` (UUID)  | —                                                        |

**`JournalStatus` enum**:

```
PENDING ──► POSTED
    └──────► VOIDED
```

- `PENDING`: entries are being added; journal not yet finalized.
- `POSTED`: balanced and finalized; affects ledger balances.
- `VOIDED`: cancelled; entries are ignored in balance calculations.

#### Domain Entity — `JournalEntry`

**File**: `libs/domain/src/ledger/entities/journal-entry.entity.ts`

| Field             | Type                                                 | Notes                                                                                |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `id`              | UUID                                                 | PK                                                                                   |
| `code`            | `number`                                             | Auto-increment display ID                                                            |
| `journalId`       | UUID                                                 | FK to `Journal`                                                                      |
| `ledgerAccountId` | UUID                                                 | FK to `LedgerAccount` — which chart-of-accounts line this affects                    |
| `dc`              | `DebitCredit`                                        | `DEBIT` \| `CREDIT`                                                                  |
| `amount`          | `string` (Decimal)                                   | Entry amount                                                                         |
| `targetType`      | `JournalEntryTarget?`                                | `INSTALLMENT` \| `LOAN` \| `SUBSCRIPTION_FEE` \| `ACCOUNT` — what this entry settles |
| `targetId`        | `string?` (UUID)                                     | ID of the settled target entity                                                      |
| `target`          | `Account \| Loan \| Installment \| SubscriptionFee?` | Polymorphic eager-loaded target                                                      |
| `accountId`       | `string?` (UUID)                                     | Denormalized member `Account` ID — stored for efficient per-account balance queries  |
| `account`         | `Account?`                                           | Eager-loaded member account                                                          |
| `removable`       | `boolean`                                            | Whether an admin can manually delete this entry                                      |
| `journal`         | `Journal?`                                           | Eager-loaded parent journal                                                          |
| `ledgerAccount`   | `Partial<LedgerAccount>?`                            | Eager-loaded chart-of-accounts record                                                |
| `ownerId`         | `string?` (UUID)                                     | Admin who created the entry                                                          |
| `createdBy`       | `string?` (UUID)                                     | Same as `ownerId`                                                                    |
| `createdAt`       | `Date`                                               | —                                                                                    |
| `isDeleted`       | `boolean`                                            | Soft-delete                                                                          |
| `deletedAt`       | `Date?`                                              | —                                                                                    |
| `deletedBy`       | `string?` (UUID)                                     | —                                                                                    |

**`DebitCredit` enum**: `DEBIT` | `CREDIT`

**`JournalEntryTarget` enum**: `INSTALLMENT` | `LOAN` | `SUBSCRIPTION_FEE` | `ACCOUNT`

#### `AllocationType` Enum

**File**: `libs/domain/src/ledger/types/journal.type.ts`

| Value              | DEBIT account               | CREDIT account             | Use case                       |
| ------------------ | --------------------------- | -------------------------- | ------------------------------ |
| `ACCOUNT_BALANCE`  | `2050` (UNAPPLIED_RECEIPTS) | `2000` (CUSTOMER_DEPOSITS) | Member deposit allocation      |
| `LOAN_REPAYMENT`   | `2050` (UNAPPLIED_RECEIPTS) | `1100` (LOANS_RECEIVABLE)  | Installment payment allocation |
| `SUBSCRIPTION_FEE` | `2050` (UNAPPLIED_RECEIPTS) | `2000` (CUSTOMER_DEPOSITS) | Subscription fee allocation    |

#### Service — `JournalsService`

**File**: `libs/application/src/ledger/journals.service.ts`

| Method                         | Description                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `findAll(query?, tx?)`         | Paginated list; filterable by `transactionId`, `targetId` (searches entries), `search` (note field); `includeEntries` flag to attach `entries` array                                                                                                                                 |
| `findOne(id, includeEntries?)` | Single journal; optionally includes all `JournalEntry` rows; throws `NotFoundException` if missing                                                                                                                                                                                   |
| `create(dto, tx?)`             | Adds a single journal entry to a PENDING journal; resolves ledger accounts by `allocationType`; handles target linking (installment → ALLOCATED, subscriptionFee → ALLOCATED); checks balance at code `2050` after entry; transitions `Transaction` to ALLOCATED when fully balanced |
| `void(id, tx?)`                | Sets journal status → VOIDED; throws `ConflictException` if already voided                                                                                                                                                                                                           |
| `remove(id, tx?)`              | Hard-deletes a journal; throws `NotFoundException` if missing                                                                                                                                                                                                                        |

**`create` flow (single entry)**:

1. Validate journal exists and is `PENDING` — `ConflictException` if already POSTED/VOIDED.
2. Resolve credit/debit ledger account IDs by `allocationType` (ACCOUNT_BALANCE → code `2000`, LOAN_REPAYMENT → code `1100`, SUBSCRIPTION_FEE → code `2000`; debit always `2050`).
3. Resolve `accountId` by tracing `targetType`/`targetId` → the member account (for denormalization).
4. Create DEBIT entry on `2050` (UNAPPLIED_RECEIPTS) — no `accountId`, no `targetType`.
5. Create CREDIT entry on the resolved credit account — with `targetType`, `targetId`, `accountId`.
6. If `allocationType === LOAN_REPAYMENT`: update Installment `status → ALLOCATED`, set `journalEntryId`.
7. If `allocationType === SUBSCRIPTION_FEE`: update SubscriptionFee `status → ALLOCATED`, set `journalEntryId`.
8. Check if `UNAPPLIED_RECEIPTS (2050)` is now balanced for this journal — if so, set `Transaction.status → ALLOCATED`.
9. Return updated journal with entries.

#### Service — `JournalEntriesService`

**File**: `libs/application/src/ledger/journal-entries.service.ts`

| Method                         | Description                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findAll(query?, tx?)`         | Paginated list of journal entries with filters                                                                                                                  |
| `addSingleEntry(dto, tx?)`     | Same logic as `JournalsService.create()` — single entry allocation with balance check                                                                           |
| `addMultipleEntries(dto, tx?)` | Batch version: processes each item in `dto.items` array using the same allocation logic; useful for bulk installment or subscription fee allocation in one call |
| `delete(id, tx?)`              | Hard-deletes a jounal entry by ID                                                                                                                               |

**`addMultipleEntries` flow**:

1. Validate journal is PENDING.
2. Resolve ledger accounts by `allocationType`.
3. For each `item` in `dto.items`: resolve `accountId`, create DEBIT + CREDIT entries, link target entity to ALLOCATED status.
4. After all items: check `2050` balance → update `Transaction.status` to ALLOCATED if balanced.
5. Return updated journal with entries.

#### Service — `LedgerAccountsService`

**File**: `libs/application/src/ledger/ledger-accounts.service.ts`

| Method                 | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `findAll(query?, tx?)` | Paginated list; ordered by `code` ascending; supports `isDeleted` filter          |
| `findOne(id)`          | Single ledger account; throws `NotFoundException` if missing                      |
| `create(dto)`          | Creates new ledger account; throws `ConflictException` if `code` already exists   |
| `update(id, dto)`      | Partial update of `name`, `type`, `status`; throws `NotFoundException` if missing |
| `remove(id)`           | Hard-deletes by ID; throws `NotFoundException` if missing                         |

#### `JournalBalanceUsecase`

**File**: `libs/application/src/ledger/journal-balance.usecase.ts`

Computes live running balances by querying POSTED journal entries. Used across the system for eligibility checks and dashboard data.

| Method                                | Returns                  | Description                                                                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `getAccountBalance(accountId, tx?)`   | `AccountBalanceResult`   | Sums POSTED entries on ledger account `2000` for the member account; splits by ACCOUNT target vs SUBSCRIPTION_FEE target |
| `getLoanBalance(loanId, tx?)`         | `LoanBalanceResult`      | Sums POSTED entries on ledger account `1100`; DEBIT = disbursed amount, CREDIT = repayments made                         |
| `getUserAccountsBalance(userId, tx?)` | `AccountBalanceResult[]` | Runs `getAccountBalance` for all non-INACTIVE accounts belonging to the user                                             |
| `getUserLoansBalance(userId, tx?)`    | `LoanBalanceResult[]`    | Runs `getLoanBalance` for all ACTIVE loans of the user                                                                   |

**`AccountBalanceResult`** (`libs/application/src/ledger/dto/journal-balance.dto.ts`):

```ts
{
  accountId: string;
  accountDeposits: {
    count: number;
    amount: number;
  } // from ACCOUNT-targeted entries
  subscriptionFeeDeposits: {
    count: number;
    amount: number;
  } // from SUBSCRIPTION_FEE entries
  totalDeposits: number; // accountDeposits.amount + subscriptionFeeDeposits.amount
}
```

**`LoanBalanceResult`**:

```ts
{
  loanId: string;
  loanAmount: number; // sum of DEBIT entries on LOANS_RECEIVABLE
  repayments: {
    count: number;
    amount: number;
  } // sum of CREDIT entries
  outstandingBalance: number; // loanAmount - repayments.amount
  paidPercentage: number; // (repayments.amount / loanAmount) * 100
}
```

#### Repository Interfaces

**`JournalRepository`** (`libs/domain/src/ledger/repositories/journal.repository.ts`):
`findById`, `create`, `update`, `updateMany`, `delete`, `findAll`, `count`

**`JournalEntryRepository`** (`libs/domain/src/ledger/repositories/journal-entry.repository.ts`):
`findAll`, `findById`, `count`, `create`, `createMany`, `update`, `updateMany`, `delete`

**`LedgerAccountRepository`** (`libs/domain/src/ledger/repositories/ledger-account.repository.ts`):
`findAll`, `count`, `findById`, `findByCode`, `create`, `update`, `delete`, `getAccountBalance(code, options?)`, `getEarliestPostedDate(code)`

#### Input / DTO Types

**`AddSingleJournalEntryDto`** (`libs/application/src/ledger/dto/add-single-journal-entry.dto.ts`):
| Field | Type | Notes |
|---|---|---|
| `journalId` | UUID | Target PENDING journal |
| `amount` | `number` | Positive value |
| `allocationType` | `AllocationType` | Controls which ledger accounts are used |
| `targetType?` | `JournalEntryTarget` | What entity is being settled |
| `targetId?` | UUID | ID of the settled entity (installment, fee, etc.) |

**`AddMultipleJournalEntriesDto`** (`libs/application/src/ledger/dto/add-multiple-journal-entries.dto.ts`):
| Field | Type | Notes |
|---|---|---|
| `journalId` | UUID | Target PENDING journal |
| `allocationType` | `AllocationType` | Same for all items in the batch |
| `targetType?` | `JournalEntryTarget` | Same for all items |
| `items` | `JournalEntryItemDto[]` | Array of `{ targetId: UUID, amount: number }` — min 1 item |

**`GetJournalsQueryDto`**: extends `PaginationQueryDto` with `includeEntries?: boolean`, `transactionId?: UUID`, `targetId?: UUID`

**`CreateJournalInput`**: `{ transactionId, postedAt?, note?, status? }`

**`CreateJournalEntryInput`**: `{ journalId, ledgerAccountId, dc, amount, targetType?, targetId?, removable?, accountId? }`

#### API Endpoints

**Admin API** — `JournalsController` (`apps/api-admin/src/ledger/journals.controller.ts`):

| Method | Path            | Description                                                                                       |
| ------ | --------------- | ------------------------------------------------------------------------------------------------- |
| `GET`  | `/journals`     | Paginated list; `?includeEntries=true` to load entries; filterable by `transactionId`, `targetId` |
| `GET`  | `/journals/:id` | Single journal; `?includeEntries=true` to load entries                                            |
| `POST` | `/journals`     | Add a single journal entry to an existing PENDING journal (allocation)                            |

**Admin API** — `JournalEntriesController` (`apps/api-admin/src/ledger/journal-entries.controller.ts`):

| Method   | Path                        | Description                                                                |
| -------- | --------------------------- | -------------------------------------------------------------------------- |
| `GET`    | `/journal-entries`          | Paginated list of all journal entries                                      |
| `POST`   | `/journal-entries`          | Add single entry to a PENDING journal (`AddSingleJournalEntryDto`)         |
| `POST`   | `/journal-entries/multiple` | Add batch of entries to a PENDING journal (`AddMultipleJournalEntriesDto`) |
| `DELETE` | `/journal-entries/:id`      | Hard-delete a journal entry by ID                                          |

**Admin API** — `LedgerAccountsController` (`apps/api-admin/src/ledger/ledger-accounts.controller.ts`):

| Method | Path               | Description                                                        |
| ------ | ------------------ | ------------------------------------------------------------------ |
| `GET`  | `/ledger-accounts` | Paginated list of chart-of-accounts entries; ordered by `code` asc |

#### Business Rules

- A journal must be in `PENDING` status to add entries — `ConflictException` if already POSTED or VOIDED.
- The DEBIT entry in the allocation flow always goes to `UNAPPLIED_RECEIPTS (2050)`; the CREDIT goes to the account determined by `allocationType`.
- `accountId` is denormalized onto every journal entry for efficient per-account balance queries; it is resolved automatically by tracing the `targetType`/`targetId` chain.
- A journal transitions `Transaction.status → ALLOCATED` automatically when the `UNAPPLIED_RECEIPTS (2050)` balance is fully settled (DEBIT = CREDIT across all entries of the journal).
- Installments linked via `LOAN_REPAYMENT` allocation move to `ALLOCATED` status immediately; SubscriptionFees linked via `SUBSCRIPTION_FEE` allocation likewise move to `ALLOCATED`.
- `LedgerAccount.code` is globally unique — `ConflictException` on duplicate code creation.
- Balance computations (`JournalBalanceUsecase`) only consider journals with `status = POSTED`.
- `removable = true` on entries created through the allocation API; entries created programmatically during loan disbursement may be `removable = false`.
- No user-facing endpoints expose ledger data — ledger is admin-only.

### 2.9 Messaging

#### Domain Entity — `Message`

**File**: `libs/domain/src/messaging/entities/message.entity.ts`

| Field           | Type                  | Notes                                                                                                                        |
| --------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`            | UUID                  | PK                                                                                                                           |
| `code`          | `number`              | Auto-increment display ID                                                                                                    |
| `type`          | `MessageType`         | `SMS` \| `PUSH_NOTIFICATION` \| `EMAIL`                                                                                      |
| `status`        | `MessageStatus`       | See lifecycle below                                                                                                          |
| `subject`       | `string?`             | Optional subject line (used for EMAIL)                                                                                       |
| `content`       | `string`              | Base (un-rendered) template content stored here; per-recipient rendered content stored in `MessageRecipient.renderedContent` |
| `templateId`    | `string?` (UUID)      | FK to `MessageTemplate`; null if content was provided inline                                                                 |
| `scheduledAt`   | `Date?`               | When set, message is delivered at this time via scheduled queue                                                              |
| `sentAt`        | `Date?`               | Timestamp when all recipients were sent                                                                                      |
| `metadata`      | `MessageMetadata?`    | JSON bag: `provider`, `cost`, `providerResponse`, `errorDetails`, `retryCount`, etc.                                         |
| `createdBy`     | `string?` (UUID)      | Admin who created/sent the message                                                                                           |
| `createdAt`     | `Date`                | —                                                                                                                            |
| `updatedAt`     | `Date`                | —                                                                                                                            |
| `template`      | `MessageTemplate?`    | Eager-loaded relation                                                                                                        |
| `recipients`    | `MessageRecipient[]?` | Eager-loaded when requested                                                                                                  |
| `createdByUser` | `User?`               | Eager-loaded relation                                                                                                        |
| `isDeleted`     | `boolean`             | Soft-delete                                                                                                                  |
| `deletedAt`     | `Date?`               | —                                                                                                                            |
| `deletedBy`     | `string?`             | —                                                                                                                            |

**`MessageStatus` enum**:

```
PENDING ──► PROCESSING ──► SENT
                      └──► FAILED
PENDING ──► SCHEDULED ──► PROCESSING → SENT | FAILED
PENDING ──► CANCELLED
```

#### Domain Entity — `MessageRecipient`

**File**: `libs/domain/src/messaging/entities/message.entity.ts`

| Field             | Type              | Notes                                                    |
| ----------------- | ----------------- | -------------------------------------------------------- |
| `id`              | UUID              | PK                                                       |
| `code`            | `number`          | Auto-increment display ID                                |
| `messageId`       | UUID              | FK to `Message`                                          |
| `userId`          | `string?` (UUID)  | FK to `User`; null for non-member recipients             |
| `phone`           | `string?`         | Raw phone number for non-member SMS targets              |
| `email`           | `string?`         | Raw email for non-member email targets                   |
| `renderedContent` | `string?`         | Per-recipient final content after variable substitution  |
| `status`          | `RecipientStatus` | `PENDING` \| `SENT` \| `DELIVERED` \| `FAILED` \| `READ` |
| `deliveredAt`     | `Date?`           | Set when delivery confirmed                              |
| `readAt`          | `Date?`           | Set when recipient reads the message                     |
| `errorMessage`    | `string?`         | Failure reason if status is `FAILED`                     |
| `createdAt`       | `Date`            | —                                                        |
| `updatedAt`       | `Date`            | —                                                        |
| `isDeleted`       | `boolean`         | Soft-delete                                              |
| `deletedAt`       | `Date?`           | —                                                        |
| `deletedBy`       | `string?`         | —                                                        |

#### Domain Entity — `MessageTemplate`

**File**: `libs/domain/src/messaging/entities/message-template.entity.ts`

| Field       | Type             | Notes                                                                     |
| ----------- | ---------------- | ------------------------------------------------------------------------- |
| `id`        | UUID             | PK                                                                        |
| `code`      | `number`         | Auto-increment display ID                                                 |
| `name`      | `string`         | Unique template name                                                      |
| `type`      | `MessageType`    | `SMS` \| `PUSH_NOTIFICATION` \| `EMAIL`                                   |
| `subject`   | `string?`        | Subject template (for EMAIL)                                              |
| `content`   | `string`         | Template body with `{{variable}}` placeholders                            |
| `variables` | `string[]`       | Declared variable names used in content (e.g., `["firstName", "amount"]`) |
| `isActive`  | `boolean`        | Only active templates can be used for sending                             |
| `createdBy` | `string?` (UUID) | Admin who created the template                                            |
| `createdAt` | `Date`           | —                                                                         |
| `updatedAt` | `Date`           | —                                                                         |
| `isDeleted` | `boolean`        | Soft-delete                                                               |
| `deletedAt` | `Date?`          | —                                                                         |
| `deletedBy` | `string?`        | —                                                                         |

#### Domain Entity — `RecipientGroup`

**File**: `libs/domain/src/messaging/entities/recipient-group.entity.ts`

| Field         | Type                     | Notes                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `id`          | UUID                     | PK                                                                                    |
| `code`        | `number`                 | Auto-increment display ID                                                             |
| `name`        | `string`                 | Group display name                                                                    |
| `description` | `string?`                | Optional description                                                                  |
| `criteria`    | `RecipientGroupCriteria` | JSON filter rules: `userStatus?`, `hasLoan?`, `hasAccount?`, `roles?`, `customQuery?` |
| `isActive`    | `boolean`                | Inactive groups cannot be targeted                                                    |
| `createdBy`   | `string?` (UUID)         | Admin who created the group                                                           |
| `createdAt`   | `Date`                   | —                                                                                     |
| `updatedAt`   | `Date`                   | —                                                                                     |
| `isDeleted`   | `boolean`                | Soft-delete                                                                           |
| `deletedAt`   | `Date?`                  | —                                                                                     |
| `deletedBy`   | `string?`                | —                                                                                     |

#### Service — `MessagingService`

**File**: `libs/application/src/messaging/services/messaging.service.ts`

| Method                                           | Description                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sendMessage(input, currentUserId?, tx?)`        | Full send flow — see below                                                                                                                                                  |
| `getMessages(query, currentUserId?, tx?)`        | Paginated message list; filterable by `type`, `status`, `templateId`, `createdBy`, `userId` (recipient filter); auto-marks messages as READ when `userId === currentUserId` |
| `findById(id, tx?)`                              | Single message; throws `NotFoundError` if missing                                                                                                                           |
| `findAll(options?, tx?)`                         | Raw find-all forwarding to repository                                                                                                                                       |
| `update(id, input, tx?)`                         | Update `status`, `sentAt`, `metadata`                                                                                                                                       |
| `updateRecipientStatus(recipientId, input, tx?)` | Update a single recipient's `status`, `readAt`, `deliveredAt`, `errorMessage`                                                                                               |
| `markMessagesAsRead(userId, messageIds, tx?)`    | Bulk mark all listed messages' recipients as READ for a given user                                                                                                          |
| `softDelete(id, tx?)`                            | Soft-delete a message                                                                                                                                                       |
| `restore(id, tx?)`                               | Restore a soft-deleted message                                                                                                                                              |
| `findScheduledMessages(beforeDate, tx?)`         | Returns all SCHEDULED messages with `scheduledAt <= beforeDate` — used by queue processor                                                                                   |

**`sendMessage` flow (all within a single DB transaction)**:

1. If `templateId` provided: fetch `MessageTemplate`, use its `content` (and `subject` if set). Otherwise use inline `content`.
2. Throw `BadRequestError` if neither `content` nor `templateId` resolves a template.
3. Create `Message` record. Status = `SCHEDULED` if `scheduledAt` is set, else `PENDING`.
4. Resolve recipients from `userIds`, `phones`, `emails`, `recipientGroupId`, or ad-hoc `recipients` array.
5. For each recipient: fetch user from DB (if `userId` present), build render vars (`fullName`, `firstName`, `lastName`, `email`, `phone`, `countryCode`, plus all `metadata`), render template with variable substitution.
6. Create one `MessageRecipient` row per resolved recipient with `renderedContent`.
7. Enqueue BullMQ jobs:
   - **Immediate**: one job per recipient on the `messaging` queue (`send-sms`, `send-email`, or `send-push` based on type), with 3 attempts + exponential back-off.
   - **Scheduled**: one delayed job on the `scheduled-messages` queue (`process-scheduled`), delayed until `scheduledAt`.
8. Return the created message with all recipients.

#### Service — `MessageTemplateService`

**File**: `libs/application/src/messaging/services/message-template.service.ts`

| Method                               | Description                            |
| ------------------------------------ | -------------------------------------- |
| `create(input, currentUserId?, tx?)` | Creates new template; sets `createdBy` |
| `findById(id, tx?)`                  | Throws `NotFoundError` if missing      |
| `findByName(name, tx?)`              | Returns `null` if not found            |
| `findAll(options?, tx?)`             | Raw find-all with Prisma args          |
| `update(id, input, tx?)`             | Partial update                         |
| `softDelete(id, tx?)`                | Marks as deleted                       |
| `restore(id, tx?)`                   | Restores soft-deleted template         |
| `count(where?, tx?)`                 | Count matching templates               |

#### Service — `RecipientGroupService`

**File**: `libs/application/src/messaging/services/recipient-group.service.ts`

| Method                               | Description                       |
| ------------------------------------ | --------------------------------- |
| `create(input, currentUserId?, tx?)` | Creates new recipient group       |
| `findById(id, tx?)`                  | Throws `NotFoundError` if missing |
| `findByName(name, tx?)`              | Returns `null` if not found       |
| `findAll(options?, tx?)`             | Raw find-all with Prisma args     |
| `update(id, input, tx?)`             | Partial update                    |
| `softDelete(id, tx?)`                | Marks as deleted                  |
| `count(where?, tx?)`                 | Count matching groups             |

#### Queue Infrastructure

**Files**: `libs/application/src/messaging/queues/`

Two BullMQ queues backed by Redis (`REDIS_HOST`, `REDIS_PORT` env):

| Queue                | Name               | Jobs                                                                                            |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `messaging`          | Immediate delivery | `send-sms`, `send-email`, `send-push` — one job per recipient; 3 attempts, exponential back-off |
| `scheduled-messages` | Delayed delivery   | `process-scheduled` — one job per scheduled message; fires after `scheduledAt` delay            |

**`MessagingProcessor`** (`libs/application/src/messaging/queues/messaging.processor.ts`):

- `@Processor('messaging')` — handles `send-sms`, `send-email`, `send-push`, `process-scheduled`
- On success: updates `MessageRecipient.status → SENT`; if all recipients SENT, updates `Message.status → SENT` + sets `sentAt`
- On failure: updates `MessageRecipient.status → FAILED` + sets `errorMessage`
- SMS/email/push provider integration is stubbed (`simulateSend`); production integration point is `handleSendSms`, `handleSendEmail`, `handleSendPush`

**`MessageJobData`** interface: `{ messageId, type, recipientId, userId?, phone?, email?, content, subject? }`

#### Repository Interfaces

**File**: `libs/domain/src/messaging/repositories/message.repository.ts`

`IMessageRepository`: `findAll`, `findById`, `findByIdWithRecipients`, `count`, `create`, `update`, `softDelete`, `restore`, `createRecipient`, `updateRecipient`, `markRecipientsAsRead`, `findRecipientsByMessageId`, `findScheduledMessages`

**File**: `libs/domain/src/messaging/repositories/message-template.repository.ts`
Methods: `findAll`, `findById`, `findByName`, `count`, `create`, `update`, `softDelete`, `restore`

**File**: `libs/domain/src/messaging/repositories/recipient-group.repository.ts`
Methods: `findAll`, `findById`, `findByName`, `count`, `create`, `update`, `softDelete`

#### DTO / Input Types

**`SendMessageDto`** (`libs/application/src/messaging/dto/send-message.dto.ts`):
| Field | Notes |
|---|---|
| `type` | `MessageType` enum — required |
| `content?` | Required if `templateId` not provided |
| `subject?` | Optional subject (EMAIL) |
| `templateId?` | UUID of `MessageTemplate` to use |
| `userIds?` | Array of user UUIDs to target |
| `phones?` | Array of raw phone numbers |
| `emails?` | Array of raw email addresses |
| `recipientGroupId?` | UUID of `RecipientGroup` for bulk targeting |
| `scheduledAt?` | Future datetime for scheduled delivery |
| `metadata?` | JSON object; values injected into template rendering |

#### API Endpoints

**Admin API** — `MessagingController` (`apps/api-admin/src/messaging/messaging.controller.ts`):

| Method   | Path                                       | Permission        | Description                                                    |
| -------- | ------------------------------------------ | ----------------- | -------------------------------------------------------------- |
| `POST`   | `/messages`                                | `message/send`    | Send immediate or scheduled message                            |
| `GET`    | `/messages`                                | `message/get`     | Paginated list; filterable by `type`, `status`, `userId`, etc. |
| `GET`    | `/messages/:id`                            | `message/get`     | Single message                                                 |
| `PATCH`  | `/messages/:id`                            | `message/update`  | Update message `status`, `metadata`                            |
| `PATCH`  | `/messages/recipients/:recipientId/status` | `message/update`  | Update a single recipient's delivery status                    |
| `DELETE` | `/messages/:id`                            | `message/delete`  | Soft-delete message                                            |
| `POST`   | `/messages/:id/restore`                    | `message/restore` | Restore soft-deleted message                                   |

**Admin API** — `MessageTemplateController` (`apps/api-admin/src/messaging/message-template.controller.ts`):

| Method   | Path                             | Permission                 | Description                                         |
| -------- | -------------------------------- | -------------------------- | --------------------------------------------------- |
| `POST`   | `/message-templates`             | `message-template/create`  | Create template                                     |
| `GET`    | `/message-templates`             | `message-template/get`     | Paginated list; searchable by `name`, `description` |
| `GET`    | `/message-templates/:id`         | `message-template/get`     | Single template                                     |
| `PATCH`  | `/message-templates/:id`         | `message-template/update`  | Update template                                     |
| `DELETE` | `/message-templates/:id`         | `message-template/delete`  | Soft-delete                                         |
| `POST`   | `/message-templates/:id/restore` | `message-template/restore` | Restore                                             |

**Admin API** — `RecipientGroupController` (`apps/api-admin/src/messaging/recipient-group.controller.ts`):

| Method   | Path                    | Permission               | Description                                         |
| -------- | ----------------------- | ------------------------ | --------------------------------------------------- |
| `POST`   | `/recipient-groups`     | `recipient-group/create` | Create group                                        |
| `GET`    | `/recipient-groups`     | `recipient-group/get`    | Paginated list; searchable by `name`, `description` |
| `GET`    | `/recipient-groups/:id` | `recipient-group/get`    | Single group                                        |
| `PATCH`  | `/recipient-groups/:id` | `recipient-group/update` | Update group                                        |
| `DELETE` | `/recipient-groups/:id` | `recipient-group/delete` | Soft-delete                                         |

#### Business Rules

- A message requires either `content` inline or a valid `templateId` — `BadRequestError` if neither is supplied.
- Template content is stored as-is on the `Message`; per-recipient variable substitution produces `MessageRecipient.renderedContent`.
- Template variables are populated from: message-level `metadata` → recipient-level `metadata` → user identity fields (`fullName`, `firstName`, `lastName`, `email`, `phone`, `countryCode`, `userId`). Recipient-level values override message-level.
- If `scheduledAt` is set, one delayed job is enqueued on `scheduled-messages` queue; otherwise individual per-recipient jobs are enqueued immediately on `messaging` queue.
- Each delivery job has 3 attempts with exponential back-off (base 1 second).
- When all `MessageRecipient` rows for a message have status `SENT`, the parent `Message.status` is automatically set to `SENT` and `sentAt` is stamped.
- `hasUnreadPushNotifications` is computed at login/refresh by checking unread `MessageRecipient` rows for the user — surfaced in the auth response.
- No messaging endpoints are exposed in `api-user` — messaging is admin-only.
- `RecipientGroup.isActive = false` groups cannot be used as message targets.
- Messages are soft-deletable; only admins can restore them.

### 2.10 File Management

#### Domain Entity — `File`

**File**: `libs/domain/src/file/entities/file.entity.ts`

| Field       | Type             | Notes                                             |
| ----------- | ---------------- | ------------------------------------------------- |
| `id`        | UUID             | PK                                                |
| `code`      | `number`         | Auto-increment display ID                         |
| `url`       | `string`         | Public URL of the stored file                     |
| `mimeType`  | `string`         | MIME type (e.g., `image/jpeg`, `application/pdf`) |
| `size`      | `number`         | File size in bytes                                |
| `createdAt` | `Date`           | —                                                 |
| `isDeleted` | `boolean`        | Soft-delete                                       |
| `deletedAt` | `Date?`          | —                                                 |
| `deletedBy` | `string?` (UUID) | —                                                 |

#### Service — `FilesService`

**File**: `libs/application/src/file/services/files.service.ts`

| Method                               | Description                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `upload(file, tx?)`                  | Saves file binary to disk under `uploads/transactions/`; creates a `File` DB record with `url`, `mimeType`, `size`; returns the created `File` |
| `findById(id, tx?)`                  | Returns `File` or `null`                                                                                                                       |
| `findAll(tx?)`                       | Returns all non-deleted files                                                                                                                  |
| `softDelete(id, currentUserId, tx?)` | Marks file as deleted; throws if not found                                                                                                     |

**`UploadedFile` input type**: `{ buffer: Buffer, originalname: string, mimetype: string, size: number }`

#### Repository — `IFileRepository`

**File**: `libs/domain/src/file/repositories/file.repository.ts`

Methods: `upload(input, tx?)`, `findById`, `findByCode`, `findAll`, `softDelete`

The `upload()` method writes the file buffer to disk and creates the DB record atomically.

#### API Endpoints

**Admin API** (`apps/api-admin/src/file/file.controller.ts`):

| Method   | Path         | Description                                                                         |
| -------- | ------------ | ----------------------------------------------------------------------------------- |
| `POST`   | `/files`     | Upload a file via `multipart/form-data` field `file`; returns created `File` record |
| `GET`    | `/files`     | List all files                                                                      |
| `GET`    | `/files/:id` | Get single file metadata                                                            |
| `DELETE` | `/files/:id` | Soft-delete file                                                                    |

#### Business Rules

- File binaries are stored on local disk under `uploads/transactions/`; only metadata (`url`, `mimeType`, `size`) is stored in the DB.
- Files are linked to transactions via `TransactionImage` (one transaction can have multiple images).
- Deleting a `TransactionImage` via `TransactionImagesService.softDelete` also soft-deletes the underlying `File` record.
- The `FileInterceptor('file')` is used for upload; no server-side file type or size validation is enforced at the controller layer — validate at the client or add middleware as needed.
- `FilesService` is injected by `TransactionsService` (for transaction receipt uploads) and `TransactionImagesService` (for image deletion).

### 2.11 Audit Log

#### Prisma Model — `AuditLog`

**Schema**: `prisma/schema.prisma` (model `AuditLog`)

| Field       | Type             | Notes                                                                           |
| ----------- | ---------------- | ------------------------------------------------------------------------------- |
| `id`        | UUID             | PK                                                                              |
| `actorId`   | `string?` (UUID) | The admin/user who performed the action; nullable for system-generated events   |
| `model`     | `string`         | Name of the affected entity (e.g., `"User"`, `"Loan"`, `"Transaction"`)         |
| `recordId`  | `string`         | UUID of the affected record                                                     |
| `action`    | `string`         | Action type (e.g., `"create"`, `"update"`, `"delete"`, `"approve"`, `"reject"`) |
| `changes`   | `Json?`          | JSON diff of before/after field values                                          |
| `ip`        | `string?`        | Client IP address at time of action                                             |
| `userAgent` | `string?`        | Client user-agent at time of action                                             |
| `createdAt` | `DateTime`       | Timestamp of the event                                                          |

**Indexes**: `actorId`, `(model, recordId)`

#### Business Rules

- `AuditLog` is **append-only** — no soft-delete, no update, no hard-delete.
- There is no application-layer service in `libs/application/src` for `AuditLog` — events must be written directly to the repository or via a dedicated interceptor/decorator.
- Must be recorded for every significant state change: create, update, delete, approve, reject, restore, activate, deactivate.
- The `changes` field should contain a JSON diff: `{ field: { before: oldVal, after: newVal } }`.
- `actorId` is `null` for scheduled/system-generated events (e.g., automated subscription fee generation).
- No API endpoint exposes `AuditLog` reads or writes — it is currently an internal/infrastructure concern.

### 2.12 Reports

#### Service — `ReportService`

**File**: `libs/application/src/report/report.service.ts`

Read-only aggregated views over ledger, loans, installments, and transactions. Never mutates data.

| Method                                           | Description                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `getFinancialSummary(startDate?, endDate?, tx?)` | Returns `BankFinancialSummary` — see below                                                 |
| `getEntitesSummary()`                            | Returns entity counts across users, accounts, loans, and transactions                      |
| `getInstallmentProjections(query?, tx?)`         | Returns paginated installment projections for current month, next month, and next 3 months |

**`getFinancialSummary` flow**:

1. If `endDate` not provided, defaults to `now()`.
2. For each of three ledger accounts (`CUSTOMER_DEPOSITS`, `LOANS_RECEIVABLE`, `FEE_COMMISSION_INCOME`):
   - Determines the earliest POSTED journal entry date if `startDate` not given.
   - Builds month-end date series from start to end.
   - Fetches balance at each month-end in parallel via `LedgerAccountRepository.getAccountBalance`.
   - Computes `lastMonth`, `monthlyAverage`, and `today` values.
3. Derives `cashOnHand = CUSTOMER_DEPOSITS − LOANS_RECEIVABLE` (floored at 0 per metric).
4. Returns `BankFinancialSummary`.

**`BankFinancialSummary`**:

```ts
{
  cashOnHand: {
    lastMonth: string;
    monthlyAverage: string;
    today: string;
  }
  customerDeposits: {
    lastMonth: string;
    monthlyAverage: string;
    today: string;
  }
  loansReceivable: {
    lastMonth: string;
    monthlyAverage: string;
    today: string;
  }
  totalIncomeEarned: {
    lastMonth: string;
    monthlyAverage: string;
    today: string;
  }
  asOfDate: Date;
}
```

**`getEntitesSummary` returns**:

```ts
{
  users: number;
  accounts: {
    total: number;
    active: number;
    restricted: number;
  }
  loans: {
    total: number;
    active: number;
    pending: number;
  }
  transactions: {
    total: number;
    pending: number;
    allocated: number;
  }
}
```

- `restricted` = accounts with status `BUSY` (locked during active loan disbursement).

**`getInstallmentProjections` returns** `InstallmentProjectionsResponse`:

```ts
{
  currentMonth: {
    expected: InstallmentGroup; // all installments due this month
    paid: InstallmentGroup; // paid subset
    pending: InstallmentGroup; // active/pending subset
  }
  nextMonth: InstallmentGroup; // due next month
  next3Months: InstallmentGroup; // due in months 2-4 from now
}
```

Each `InstallmentGroup`: `{ count: number; totalAmount: string; installments: InstallmentWithDetails[] }`
`InstallmentWithDetails` includes `loan.user.identity` for name display.
Pagination is applied to the installment list within each group.

#### API Endpoints

**Admin API** (`apps/api-admin/src/report/report.controller.ts`):

| Method | Path                               | Description                                                                                               |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET`  | `/report/dashboard/summary`        | Financial summary: cash on hand, deposits, loans receivable, income (with last-month/avg/today breakdown) |
| `GET`  | `/report/dashboard/entities`       | Entity count dashboard: users, accounts, loans, transactions                                              |
| `GET`  | `/report/projections/installments` | Paginated installment projections for current month, next month, next 3 months                            |

#### Business Rules

- All report queries are read-only — `ReportService` never calls any `create`, `update`, or `delete` methods.
- Balance computations use `LedgerAccountRepository.getAccountBalance` which only considers POSTED journals.
- All monetary values are formatted to 4 decimal places and returned as strings.
- `getInstallmentProjections` uses manual pagination (not `paginatePrisma`); pagination applies to the list within each group, not across groups.
- `cashOnHand` is derived (not a ledger account) — computed as `CUSTOMER_DEPOSITS − LOANS_RECEIVABLE`; floored at 0 to avoid negative display values.
- No user-facing report endpoints exist in `api-user`.

---

## 3. Universal Conventions

- **Soft delete**: every entity (except `AuditLog`, `JournalEntry`) has `isDeleted: Boolean`, `deletedAt: DateTime?`, `deletedBy: String? (UUID)`. Queries always filter `isDeleted: false` unless the caller explicitly requests deleted records.
- **Auto-increment `code`**: human-friendly integer ID on all major entities. Use `code` in UI; use `id` (UUID) in API URLs and relations.
- **`ownerId` / `createdBy`**: tracks who created a record (admin UUID). Separate from the user the record belongs to.
- **Decimal precision**: all monetary amounts use `Decimal(18, 4)` — never use `Float` for money.
- **Timestamps**: `createdAt` (default now), `updatedAt` (auto-updated). All in UTC; display layer converts to `Asia/Tehran`.
- **No raw Prisma in controllers**: controllers inject application services, never `PrismaService` directly.
- **Error handling**: throw NestJS exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`) from services. Custom domain errors extend `AppError` in `libs/application/src/errors/app.error.ts`. All errors are mapped to RFC 7807 Problem Details by the global filter in `libs/problem-details`.

---

## 4. Key Financial Flows (Step-by-Step)

### Member Deposit Flow

1. Member deposits money externally (bank transfer, cash).
2. Admin creates a `Transaction` (kind: DEPOSIT, status: PENDING) with optional receipt images.
3. Admin reviews and sets status to APPROVED.
4. Admin runs **Allocate**: creates a `Journal` + `JournalEntry` rows (DEBIT `MEMBERS_DEPOSIT` ledger account, CREDIT bank cash account). Transaction moves to ALLOCATED.

### Subscription Fee Collection Flow

1. Admin (or scheduled job) generates `SubscriptionFee` rows for all active accounts for the current period.
2. Fee amount = `Bank.subscriptionFee`.
3. Member pays (deposit transaction). Admin allocates the transaction to the `SubscriptionFee` target.
4. `SubscriptionFee.status` → ALLOCATED. Journal entry created crediting `SUBSCRIPTION_FEE_INCOME`.

### Loan Disbursement Flow

1. Member submits a `LoanRequest` (status: PENDING).
2. Admin reviews and sets LoanRequest status to APPROVED or REJECTED.
3. If APPROVED, admin converts it to a `Loan` (status: PENDING). LoanRequest status → CONVERTED.
4. Admin sets Loan status to APPROVED (formal sign-off).
5. Admin disburses: creates a `Transaction` (kind: LOAN_DISBURSEMENT) + Journal entries:
   - DEBIT `LOAN_RECEIVABLE`
   - CREDIT `MEMBERS_DEPOSIT` (funds come from pooled deposits)
   - Additional entry for commission: DEBIT `LOAN_RECEIVABLE` (or `COMMISSION_RECEIVABLE`), CREDIT `COMMISSION_INCOME`
6. Installments are created in bulk. Loan status → ACTIVE.
7. Account status may be set to BUSY during disbursement and then restored to ACTIVE.

### Loan Repayment Flow

1. Member deposits installment payment (same deposit flow as above).
2. Admin allocates the transaction, targeting an `Installment` (`targetType: INSTALLMENT`, `targetId: installment.id`).
3. Installment status → ALLOCATED (or PAID after confirmation).
4. When all installments are PAID, Loan status → PAID.

---

## 5. App Responsibilities Split

| Concern           | `api-admin`                               | `api-user`                       |
| ----------------- | ----------------------------------------- | -------------------------------- |
| User management   | Full CRUD                                 | Read own profile                 |
| Loan requests     | Review, approve, reject, convert          | Submit, view own                 |
| Loans             | Create, approve, disburse, manage         | View own loans & installments    |
| Transactions      | Full CRUD, approve, allocate              | Submit deposit request, view own |
| Ledger            | Full access (journals, entries, accounts) | No access                        |
| Subscription fees | Generate, allocate                        | View own                         |
| Messaging         | Send, template CRUD, recipient groups     | No access                        |
| RBAC              | Role/permission CRUD, assignments         | No access                        |
| Reports           | Full access                               | Limited (own summary)            |
| Files             | Upload, manage                            | Upload own receipts              |

---

## 6. Validation Rules Summary

- **LoanRequest**: `amount > 0`, `paymentMonths` within `[loanType.minInstallments, loanType.maxInstallments]`, `startDate` not in the past.
- **Loan creation from LoanRequest**: LoanRequest must be APPROVED; account must be ACTIVE (not BUSY); member balance ≥ `amount × creditRequirementPct / 100`.
- **Installment count**: `paymentMonths` must appear in `Bank.installmentOptions`.
- **SmsCode**: max 5 attempts; expires after TTL; consumed codes cannot be reused.
- **RefreshToken reuse**: if a revoked token is presented again, revoke all tokens for that user (cascade invalidation).
- **Journal balance**: sum of DEBIT entries must equal sum of CREDIT entries before POSTING.
- **SubscriptionFee uniqueness**: one fee per `(accountId, periodStart)` — no duplicate charges.
- **Account card number**: globally unique across all accounts.
- **Permission deny override**: a `PermissionGrant` with `isGranted = false` takes precedence over role-based grants.
