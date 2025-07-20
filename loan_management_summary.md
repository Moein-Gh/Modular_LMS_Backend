# Loan Management System (NestJS + PostgresSQL) – Action Plan

_Last updated: 2025-07-20_

---

## 1 ▪ Workspace & Project Skeleton
- **Bootstrap Nx monorepo**
  ```bash
  npx create-nx-workspace@latest loan-platform
  cd loan-platform
  ```
- **Generate two Nest applications**
  ```bash
  nx g @nestjs/nest:app api-user    # public endpoints
  nx g @nestjs/nest:app api-admin   # privileged endpoints
  ```
- **Create shared libraries (clean‐architecture layers)**
  ```bash
  nx g @nx/js:lib domain         # pure business entities & VOs
  nx g @nx/js:lib application    # use‑cases (CQRS)
  nx g @nestjs/nest:lib infra    # persistence, brokers
  nx g @nx/js:lib shared-kernel  # enums, common utils
  ```

---

## 2 ▪ Core Domain Model
| Entity                | Key fields                                                 |
|-----------------------|------------------------------------------------------------|
| **Loan**              | id, principal, interestRate, term, status                  |
| **Customer**          | id, name, KYCStatus                                        |
| **RepaymentSchedule** | id, loanId, dueDate, amountDue, amountPaid                 |
| **Transaction**       | id, loanId, type (disbursement/payment), amount, timestamp |

> _Value Objects_: **Money**, **Percentage**, **DateRange**.  
> _Aggregates_: `LoanAggregate` (root = Loan).

---

## 3 ▪ Application Layer
- Adopt **CQRS** with `@nestjs/cqrs`  
  - _Commands_: `ApplyForLoan`, `ApproveLoan`, `MakePayment`  
  - _Queries_: `GetLoanDetails`, `ListCustomerLoans`
- Implement Sagas for multi‑step flows (approval, disbursement).

---

## 4 ▪ Infrastructure Layer
| Concern        | Technology                       |
|----------------|----------------------------------|
| ORM            | **Prisma v6** (`@prisma/client`) |
| Database       | **PostgresSQL 16** (Docker)      |
| Cache          | Redis                            |
| Message Broker | RabbitMQ → Kafka (future)        |
| Search         | OpenSearch/Elastic (optional)    |

### Docker Compose snippet
```yaml
postgres:
  image: postgres:16
  environment:
    POSTGRES_DB: loan_db
    POSTGRES_USER: loan_user
    POSTGRES_PASSWORD: secret
  ports: ["5432:5432"]
```

---

## 5 ▪ Interface Layer (API)
- REST **and/or** GraphQL (Nest GraphQL) controllers.  
- DTO validation via `class-validator`.  
- Version resources (`v1`, `v2`) under `/api` prefix.

### Authentication & Authorization
| Audience | Strategy                              |
|----------|---------------------------------------|
| Users    | JWT (Passport)                        |
| Admins   | JWT + **RoleGuard** (`role: "admin"`) |

---

## 6 ▪ Admin Panel
- Integrate **AdminJS** (= AdminBro).  
- Mount at `/admin`; restrict with role‑based guard.  
- Provide CRUD for Loan, Customer, RepaymentSchedule.

---

## 7 ▪ Testing & Quality
| Layer       | Tool             |
|-------------|------------------|
| Unit/domain | Jest (`ts-jest`) |
| API E2E     | SuperTest        |
| Contract    | Pact (optional)  |
| Load        | k6 scripts       |

Add Husky pre‑commit → `lint`, `test`, `build`.

---

## 8 ▪ Observability
- **Logging**: Pino → Grafana Loki.  
- **Metrics**: Prometheus exports via `@willsoto/nestjs-prometheus`.  
- **Tracing**: OpenTelemetry SDK + Jaeger.

---

## 9 ▪ Security Checklist
- BCrypt hash passwords (12 rounds).  
- HTTPS/TLS termination (Ingress or Nginx).  
- Rate limit (`@nestjs/throttler`).  
- Field‑level encryption for PII (`pgcrypto`).  
- Store secrets in **Vault** or KMS.

---

## 10 ▪ CI / CD
1. **GitHub Actions**
   - **job:** _test_
   - **job:** _build Docker_
   - **job:** _deploy_ (Kubernetes)
2. Automatic Prisma migrations on deploy.

---
__
## 11 ▪ Deployment
- Start with **docker‑compose** (local / staging).  
- Promote to **Kubernetes** (Helm chart) when scaling.  
- Use Horizontal Pod Autoscale on API pods.

---

## 12 ▪ Next 2‑Week Sprint Outline
- [ ] Day 1‑2 ➜ scaffold Nx + Nest apps & libs  
- [ ] Day 3‑4 ➜ design Prisma schema & run first migration  
- [ ] Day 5‑7 ➜ implement Loan domain + ApplyForLoan use‑case  
- [ ] Day 8‑9 ➜ secure JWT auth, public vs admin routes  
- [ ] Day 10‑12 ➜ add AdminJS CRUD, seed demo data  
- [ ] Day 13‑14 ➜ write unit & e2e tests, set up CI pipeline  

---

> **Tip:** Keep domain files framework‑free; infrastructure depends _on_ domain, never the other way around. This enforces clean architecture. 

Good luck – ship small vertical slices early and iterate!
