# Known bugs / gaps found during admin+user API merge

Tracking issues noticed while merging `apps/api-admin` and `apps/api-user` into
one app. These are pre-existing behaviors carried over as-is during the merge,
not introduced by it — fix one at a time when ready.

## 1. User-side journal routes don't scope to the current user

- **Where:** `apps/api-admin/src/ledger/journals.controller.ts` —
  `findAllForUser` (`GET /user/journals`) and `getForUser`
  (`GET /user/journals/:id`)
- **Issue:** Unlike the equivalent user routes for accounts, loans, and
  transactions, these two never filter/check against `CurrentUserId()`. Any
  authenticated user can list all journals or fetch any journal by ID,
  regardless of ownership.
- **Fix:** Add a `userId` filter to `findAllForUser`'s query (if
  `JournalsService.findAll` supports it) and an ownership check +
  `ForbiddenException` in `getForUser`, mirroring
  `AccountsController.getForUser` / `LoansController.getForUser`.

## 2. Docs/tracking files still describe the old two-app, `api-admin`-named architecture

- **Where:**
  - `.github/instructions/copilot-instructions.md`
  - `.github/instructions/business-logic.instructions.md` (~15 stale
    references — route tables, ownership-check descriptions, the
    api-admin vs api-user comparison table, etc.)
  - `todos.yaml` (several entries reference `apps/api-admin/...` file paths
    and an `api-admin` tag)
  - `apps/api/src/messaging/README.md` (references `apps/api-admin/src/messaging/`
    and `api-admin.module.ts`)
- **Issue:** These all predate two changes: (1) merging `apps/api-user` into
  one app with `admin/*`/`user/*` route prefixes, and (2) renaming
  `apps/api-admin` → `apps/api` (`ApiAdminModule` → `ApiModule`, etc). None of
  the old paths/names/comparisons are accurate anymore.
- **Fix:** Rewrite `copilot-instructions.md` and `business-logic.instructions.md`
  to describe the single `apps/api` app with routes split by prefix instead of
  by app (sizable rewrite, do as its own pass). Update the file paths in
  `todos.yaml` and `messaging/README.md` (quick find/replace).
