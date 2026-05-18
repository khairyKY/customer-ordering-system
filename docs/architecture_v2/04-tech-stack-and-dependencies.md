# 04 — Tech Stack & Dependencies

> **⚠️ POST-MIGRATION NOTE.** The Node/Express dev-time backend at
> `src/backend/` and its `:3001` port were deleted in commit `819ce7b`
> (Member C's tickets migration). The shipped backend is FastAPI on
> `:8000` only. References below to Node, `:3001`, or `src/backend/`
> describe the original architecture and are preserved as history.


## Technology Selection Table

| Layer | Technology | Version / Notes | Justification |
|---|---|---|---|
| **Frontend Framework** | React | 18 + Vite | Industry-standard SPA; JSX enforces component isolation per feature slice |
| **Styling** | Tailwind CSS | Latest | Utility-first; eliminates global CSS conflicts between feature slices |
| **State Management** | Zustand | Latest | Lightweight; per-slice stores avoid Redux boilerplate and cross-slice coupling |
| **API Client** | Axios + React Query | Latest | Declarative data fetching; automatic cache invalidation; aligns with TDD patterns |
| **Backend Runtime** | Node.js + Express | Latest LTS | Minimal framework; routes map cleanly to feature slice directories |
| **Validation** | Zod | Latest | Schema-first; shared between frontend and backend via a `shared/` package |
| **ORM** | Prisma | Latest | Schema-as-code; migrations are version-controlled and owned per slice |
| **Database** | PostgreSQL | 15 | ACID compliance required for transactional order processing |
| **Authentication** | JWT + bcrypt | Latest | Stateless auth; compatible with the vertical slice model |
| **Unit Testing** | Vitest + React Testing Library | Latest | Vite-native; zero-config setup |
| **E2E Testing** | Playwright | Latest | Browser automation; tests user journeys across slices |
| **CI/CD** | GitHub Actions | Free tier | Free for student accounts; integrates with branch protection rules |
| **Containerisation** | Docker Compose | Latest | Reproducible dev environment; `db`, `backend`, `frontend` services |

---

## Service Port Map

| Service | Port | URL |
|---|---|---|
| Frontend (Vite dev server) | 5173 | `http://localhost:5173` |
| Backend (Express) | 3001 | `http://localhost:3001` |
| Database (PostgreSQL) | 5432 | Internal (docker network) |

---

## Environment Variables

Reference `.env.example` for all required variables. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma connection string for development DB |
| `TEST_DATABASE_URL` | Separate connection string for integration test DB |
| `JWT_SECRET` | Secret key for JWT signing (Member B manages) |
| `PORT` | Backend server port (default: 3001) |
| `VITE_API_BASE_URL` | Frontend env var for backend API base URL |

---

## Local Development Commands

```bash
# Start all services
docker compose up -d

# Backend hot-reload logs
docker compose logs -f backend

# Apply database migrations
cd src/database && npx prisma migrate dev

# Open Prisma Studio (DB browser)
cd src/database && npx prisma studio

# Regenerate Prisma client after schema change
cd src/database && npx prisma generate

# Run frontend tests
cd src/frontend && npx vitest run

# Run frontend tests with coverage
cd src/frontend && npx vitest run --coverage

# Run backend tests
cd src/backend && npx vitest run

# Run E2E tests
cd src/frontend && npx playwright test
```

---

## Coverage Thresholds (vitest.config.ts)

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 70
  }
}
```

All files under `src/features/checkout/` must meet these thresholds.

---

## Dependency Installation Notes

- All `package.json` changes require a **dedicated PR** with the commit message format: `chore(deps): add {package-name}`.
- No feature PR should bundle dependency changes.
- Shared Zod schemas are consumed by both frontend and backend; ensure the same version is pinned in both `package.json` files to prevent type mismatch.
