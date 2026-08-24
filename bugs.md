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

## 2. `.github/instructions/*.md` still describe the old two-app architecture

- **Where:** `.github/instructions/copilot-instructions.md` and
  `.github/instructions/business-logic.instructions.md`
- **Issue:** These docs (used as AI agent instructions) still reference
  `apps/api-user` extensively — as a separate app, with its own controller
  paths, its own port, its own Docker service — none of which exists anymore
  after the admin+user merge. `business-logic.instructions.md` alone has
  ~15 stale references (route tables, ownership-check descriptions, the
  api-admin vs api-user comparison table, etc.).
- **Fix:** Rewrite both docs to describe the single merged `api-admin` app,
  with routes split by `admin/*` vs `user/*` prefix instead of by app. This
  is a sizable rewrite, not a quick edit — do as its own pass.
