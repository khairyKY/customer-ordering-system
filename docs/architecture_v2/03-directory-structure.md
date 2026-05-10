# 03 — Repository Directory Structure

## Root Layout

```
cse323-customer-ordering-system/
│
├── .ai/
│   └── CONTEXT.md                    # Master AI Brain — MUST be updated after every task
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Run tests on all PRs to develop
│       └── deploy.yml                # Deploy on merge to main
│
├── docs/
│   └── MASTER.md                     # Master project documentation
│
├── src/
│   ├── frontend/                     # React + Vite application
│   ├── backend/                      # Node.js + Express API
│   └── database/                     # Prisma ORM + PostgreSQL
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Frontend — `src/frontend/`

```
src/frontend/
├── public/
├── src/
│   ├── features/                     # VERTICAL SLICE ROOT — one dir per feature
│   │   │
│   │   ├── auth/                     # Member B
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── api/
│   │   │   └── __tests__/
│   │   │
│   │   ├── catalog/                  # Member C
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── api/
│   │   │   └── __tests__/
│   │   │
│   │   ├── checkout/                 # Member A — FULL OWNERSHIP
│   │   │   ├── components/
│   │   │   │   ├── CartDrawer.tsx
│   │   │   │   ├── CartItem.tsx
│   │   │   │   ├── CartSummary.tsx
│   │   │   │   ├── CheckoutForm.tsx
│   │   │   │   ├── CheckoutStepper.tsx
│   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   ├── ShippingForm.tsx
│   │   │   │   └── PromoCodeInput.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCart.ts
│   │   │   │   ├── useCheckout.ts
│   │   │   │   └── usePromoCode.ts
│   │   │   ├── store/
│   │   │   │   └── cartStore.ts
│   │   │   ├── api/
│   │   │   │   ├── cartApi.ts
│   │   │   │   └── checkoutApi.ts
│   │   │   ├── types/
│   │   │   │   └── checkout.types.ts
│   │   │   └── __tests__/
│   │   │       ├── CartItem.test.tsx
│   │   │       ├── CartSummary.test.tsx
│   │   │       ├── CheckoutForm.test.tsx
│   │   │       ├── cartStore.test.ts
│   │   │       └── useCart.test.ts
│   │   │
│   │   └── orders/                   # Member B + C (shared post-checkout)
│   │
│   ├── shared/                       # STRICTLY READ-ONLY for feature slices
│   │   ├── components/               # Generic UI primitives (Button, Input, Modal)
│   │   ├── hooks/                    # Generic hooks (useDebounce, useLocalStorage)
│   │   ├── utils/                    # Pure utility functions
│   │   └── types/                    # Shared TypeScript types (User, Product)
│   │
│   ├── App.tsx                       # Root router — touches only route definitions
│   └── main.tsx                      # Entry point
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Backend — `src/backend/`

```
src/backend/
└── src/
    ├── features/                     # MIRRORS FRONTEND VERTICAL SLICE ROOT
    │   ├── auth/                     # Member B
    │   ├── catalog/                  # Member C
    │   ├── checkout/                 # Member A — FULL OWNERSHIP
    │   │   ├── cart.routes.ts
    │   │   ├── cart.controller.ts
    │   │   ├── cart.service.ts
    │   │   ├── checkout.routes.ts
    │   │   ├── checkout.controller.ts
    │   │   ├── checkout.service.ts
    │   │   ├── checkout.validators.ts
    │   │   └── __tests__/
    │   │       ├── cart.service.test.ts
    │   │       └── checkout.service.test.ts
    │   └── orders/
    │
    ├── shared/
    │   ├── middleware/               # Auth guard, error handler, request logger
    │   ├── utils/
    │   └── types/
    │
    ├── app.ts                        # Express app factory
    └── server.ts                     # HTTP server entry point
```

---

## Database — `src/database/`

```
src/database/
├── schema.prisma                     # Canonical data model
├── migrations/                       # Auto-generated — DO NOT hand-edit
│   ├── 001_init_users/
│   ├── 002_init_products/
│   ├── 003_checkout_cart/            # Member A's migration
│   └── 004_checkout_orders/          # Member A's migration
└── seed/
    ├── products.seed.ts
    └── users.seed.ts
```

---

## Key Structural Rules

1. **Vertical Slice Root:** `src/frontend/src/features/` and `src/backend/src/features/` are the canonical roots. Each subdirectory is exclusively owned by one team member.

2. **Shared is Read-Only:** `src/*/shared/` is read-only for all feature slices. Changes to shared files require an RFC and explicit approval from all affected slice owners.

3. **App.tsx Protocol:** `App.tsx` uses a route configuration array. Each member exports routes from their slice's `routes.ts`. `App.tsx` is not edited directly after Sprint 0.
   ```typescript
   // App.tsx — untouched after Sprint 0
   import { checkoutRoutes } from './features/checkout/routes';
   import { catalogRoutes } from './features/catalog/routes';
   import { authRoutes } from './features/auth/routes';
   const allRoutes = [...authRoutes, ...catalogRoutes, ...checkoutRoutes];
   ```

4. **Schema Prisma Protocol:** Members never hand-edit `schema.prisma` directly. Changes are made via `prisma migrate dev --name {slice}_{description}`. Schema PRs must not be in-flight simultaneously with other schema PRs.

5. **Package.json Protocol:** Dependency changes require a dedicated PR with subject: `chore(deps): add {package-name}`. No feature PR should include dependency changes.
