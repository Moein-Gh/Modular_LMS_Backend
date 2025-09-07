---
applyTo: '**'
---

## AI agent workflow: from entity to controllers (end-to-end)

Follow this concise, repeatable flow to add a new resource from database model to API controllers. Always mention the exact file name and path for every change you make.

1. Plan the resource

- Decide the bounded context folder (e.g., `user`, `bank`, `auth`) used under `libs/domain/src`, `libs/application/src`, and app `apps/api-*/src`.
- Define the entity name (PascalCase) and table/model name (snake_case or Prisma's convention).

2. Database: Prisma model and migration

- File to edit: `prisma/schema.prisma`
  - Add a new `model` with fields, indexes, and relations.
  - Reuse or add `enum`s as needed.
- Create a migration and generate client:
  - Commands (PowerShell):
    - pnpm prisma migrate dev --name add\_<entity>
    - pnpm prisma generate
- Verify the generated client output is in `generated/prisma` (per repo setup) and CI can build.

3. Domain layer: types and repository contract

- New files:
  - `libs/domain/src/<context>/<entity>/entities/<entity>.ts` — domain entity type(s)/value objects.
  - `libs/domain/src/<context>/<entity>/repositories/<entity>.repository.ts` — interface `I<Entity>Repository` defining CRUD/query signatures.
- Update module exports:
  - `libs/domain/src/index.ts` — export the new types and repository interface.

4. Infra layer: Prisma repository implementation

- New files:
  - `libs/infra/src/<context>/<entity>/<entity>.prisma.repository.ts` — implements `I<Entity>Repository` using `PrismaService`.
  - Optionally `libs/infra/src/<context>/<entity>/<entity>.mapper.ts` — DB <-> domain mapping.
- Wire DI providers where appropriate (pick one):
  - In the consuming app module (e.g., `apps/api-admin/src/api-admin.module.ts`) provide `{ provide: I<Entity>Repository, useClass: <Entity>PrismaRepository }` and import `PrismaModule` from `libs/infra/src/prisma/prisma.module.ts`.
  - Or, if you have an infra module for the context, register the provider there and export it.

5. Application layer: DTOs, use cases, and service

- New files:
  - `libs/application/src/<context>/<entity>/dto/create-<entity>.dto.ts`
  - `libs/application/src/<context>/<entity>/dto/update-<entity>.dto.ts`
  - `libs/application/src/<context>/<entity>/<entity>.service.ts` — orchestrates repository calls.
  - Optional: `libs/application/src/<context>/<entity>/<entity>.use-cases.ts` if you prefer discrete use cases.
- Conventions:
  - Use `class-validator`/`class-transformer` in DTOs; no `any` types.
  - Keep method return types explicit. Surface domain types or read-models (DTOs) — not raw Prisma types.
- Expose via `libs/application/src/index.ts` for app imports.

6. API controllers: admin and/or user app

- New files (choose target app):
  - Admin: `apps/api-admin/src/<entity>/<entity>.controller.ts`
  - User: `apps/api-user/src/<entity>/<entity>.controller.ts`
- Register controllers and providers:
  - `apps/api-*/src/api-*.module.ts` — add controller, import `PrismaModule`, and provide the repository binding if not centralized.
- Controller guidance:
  - Inject the application service; never inject Prisma directly.
  - Add `@ApiTags('<Entity>')`, request/response DTOs, and `@ApiOperation` summaries.
  - Use global problem-details mapping for errors (see `libs/problem-details`). Throw Nest exceptions from application or map domain errors to RFC7807.
  - The custom errors should inherit from AppError in `libs/applications/src/errors/app.error.ts`.
  - Apply auth/permission guards if needed (e.g., use guards under `apps/api-admin/src/access/`).

7. Wiring and exports

- Ensure `index.ts` barrels export any new symbols:
  - `libs/domain/src/index.ts`
  - `libs/application/src/index.ts`
  - Add provider tokens as constants or Symbols to avoid stringly-typed DI.

Notes

- Keep boundaries: apps -> application -> domain. Infra is injected via DI; apps should not reach into Prisma directly.
- Use problem-details consistently for error responses.
- Never use `any`; keep DTO and return types explicit end-to-end.
