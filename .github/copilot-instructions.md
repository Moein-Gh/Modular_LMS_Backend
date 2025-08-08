# Copilot Instructions for Modular_LMS_Backend

## General

- always mention the file name that the changes should occure in
- if the code if for a new file, give the file's name and path

## Project Architecture

- **Monorepo Structure**: Uses NestJS with multiple apps (`api-admin`, `api-user`) and shared libraries (`application`, `config`, `domain`, `infra`, `problem-details`).
- **Apps**: Each app has its own entry (`main.ts`), module, controller, and service. Example: `apps/api-admin/src/`.
- **Shared Libraries**: Business logic, configuration, domain models, infrastructure, and error handling are in `libs/`.
- **Database**: Uses PostgreSQL via Prisma ORM. Prisma client is generated in `generated/prisma` and configured in `libs/infra/src/prisma/prisma.module.ts`.
- **API Documentation**: Swagger and Scalar UI are set up via `libs/infra/src/docs/openapi.ts`.

## Developer Workflows

- **Install dependencies**: `pnpm install`
- **Build**: `pnpm run build` (uses NestJS CLI, monorepo-aware)
- **Start (dev)**: `pnpm run start:dev` or `pnpm run start:admin` / `pnpm run start:user` for specific apps (hot reload enabled)
- **Start (prod)**: `pnpm run start:prod` (runs compiled code)
- **Lint**: `pnpm run lint` (uses ESLint, config in `eslint.config.mjs`)
- **Test**: `pnpm run test` (unit), `pnpm run test:e2e` (e2e for admin), `pnpm run test:cov` (coverage)
- **Docker Compose**: `docker-compose.yml` defines services for db, api-admin, api-user. Watch mode is available but may cause container name conflicts; prefer volume mounts for live reload.

## Conventions & Patterns

- **Environment Variables**: Validated via Zod in `libs/config/src/env.schema.ts`. All services expect `.env` or Compose envs for DB, ports, etc.
- **Error Handling**: Uses RFC 7807 Problem Details pattern (`libs/problem-details`). All exceptions are filtered and returned in a standard format.
- **API Docs**: `/swagger` for Swagger UI, `/reference` for Scalar UI (see `setupDocs` in infra docs).
- **Prisma**: Database access via `PrismaService` in `libs/infra/src/prisma/prisma.module.ts`. Always connect/disconnect using lifecycle hooks.
- **Module Boundaries**: Apps import only what they need from libraries. Shared logic goes in `libs/`, not in apps.
- **Testing**: Jest is configured for both unit and e2e. E2E config is in `apps/api-admin/test/jest-e2e.json`.
- **TypeScript Paths**: Aliases for libraries are set in `package.json` under `jest.moduleNameMapper`.

## Integration Points

- **Postgres**: All DB access via Prisma. Connection string is set via env (`DATABASE_URL`).
- **Swagger/Scalar**: API docs auto-generated and served by each app.
- **Docker**: Services communicate via Docker Compose network. DB is available as `db:5432`.

## Examples

- To add a new app: create under `apps/`, update `nest-cli.json`, add scripts in `package.json`.
- To add a new shared library: create under `libs/`, update `nest-cli.json`, use TypeScript path aliases.
- To expose a new API endpoint: add to the relevant controller in `apps/{app}/src/`, update service as needed.
- To add environment validation: update `libs/config/src/env.schema.ts`.

## Known Issues

- Docker Compose watch mode may cause container name conflicts. If encountered, use `docker compose down --remove-orphans` before restarting.
- Prisma binary targets must match deployment OS. Update `schema.prisma` and run `npx prisma generate` if deploying to Linux.

---

If any section is unclear or missing, please provide feedback so instructions can be improved.

## Type safety

- Never use `any` type
- Always define explicit types for function parameters and return values
- Use TypeScript interfaces and types to model complex data structures
