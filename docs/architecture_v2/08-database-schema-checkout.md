# 08 — Database Schema — Checkout Domain

## Ownership & Governance

**Owner:** Member A
**Location:** `src/database/schema.prisma` (checkout section)
**Migrations:** `src/database/migrations/003_checkout_cart/` and `004_checkout_orders/`

No other team member may modify these models without a formal RFC documented in `.ai/CONTEXT.md`.

> **Rule:** Never hand-edit `schema.prisma` directly. Always use `npx prisma migrate dev --name checkout_{description}` to generate migration files.

---

## Prisma Models

```prisma
// src/database/schema.prisma — CHECKOUT DOMAIN (Member A ownership)

model Cart {
  id         String     @id @default(cuid())
  userId     String?    // Null for guest carts (session-based)
  sessionId  String?    // Guest session identifier
  items      CartItem[]
  promoCode  String?
  discount   Float      @default(0)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  user       User?      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  unitPrice Float    // Snapshotted at time of add — prevents price-change bugs
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@index([cartId])
}

model Order {
  id              String      @id @default(cuid())
  userId          String?
  sessionId       String?
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  subtotal        Float
  discount        Float       @default(0)
  tax             Float
  shippingCost    Float
  total           Float
  promoCode       String?
  shippingAddress Json        // { street, city, state, zip, country }
  billingAddress  Json?
  paymentRef      String?     // External payment provider reference
  notes           String?
  placedAt        DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User?       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String  // Snapshotted — order history must be immutable
  quantity    Int
  unitPrice   Float
  totalPrice  Float

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model PromoCode {
  id                String   @id @default(cuid())
  code              String   @unique
  discountType      String   // "PERCENTAGE" | "FIXED"
  discountValue     Float
  minimumOrderValue Float    @default(0)
  usageLimit        Int?
  usageCount        Int      @default(0)
  expiresAt         DateTime?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

---

## Model Reference Guide

### Cart

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String?` | Null for guest carts |
| `sessionId` | `String?` | Guest session identifier (from `x-session-id` header) |
| `items` | `CartItem[]` | One-to-many relation |
| `promoCode` | `String?` | Applied promo code string |
| `discount` | `Float` | Computed discount amount |

### CartItem

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `cartId` | `String` | FK to Cart |
| `productId` | `String` | FK to Product (Member C's model) |
| `quantity` | `Int` | Min 1, max 99 |
| `unitPrice` | `Float` | **Snapshotted at time of add** — not joined from Product |

> **Critical:** `unitPrice` is snapshotted to prevent price changes from affecting in-progress carts. Always read `CartItem.unitPrice`, never `Product.price`, when displaying cart totals.

### Order

| Field | Type | Notes |
|---|---|---|
| `status` | `OrderStatus` | Starts as `PENDING`, transitions to `CONFIRMED` on success |
| `shippingAddress` | `Json` | Stored as JSON blob — `{ street, city, state, zip, country }` |
| `paymentRef` | `String?` | Mock UUID for academic scope; real gateway token in production |
| `tax` | `Float` | Fixed 8% in current implementation |

### OrderItem

| Field | Type | Notes |
|---|---|---|
| `productName` | `String` | **Snapshotted** — order history is immutable; do not join Product for display |
| `unitPrice` | `Float` | Snapshotted at order placement time |
| `totalPrice` | `Float` | Computed: `quantity * unitPrice` |

### PromoCode

| Field | Type | Notes |
| `discountType` | `String` | Either `"PERCENTAGE"` or `"FIXED"` |
| `minimumOrderValue` | `Float` | Cart subtotal must meet or exceed this value |
| `usageLimit` | `Int?` | Null = unlimited |
| `usageCount` | `Int` | Incremented atomically on order placement |

---

## Migration Commands

```bash
cd src/database

# Create and apply a new migration
npx prisma migrate dev --name checkout_cart_init

# Apply all pending migrations (CI / production)
npx prisma migrate deploy

# Reset development database (DESTROYS ALL DATA)
npx prisma migrate reset --force

# Reset test database before integration test suite
TEST_DATABASE_URL=<test_url> npx prisma migrate reset --force

# Open Prisma Studio
npx prisma studio

# Regenerate TypeScript types after schema change
npx prisma generate
```

---

## Integration Test — Schema Smoke Test

```typescript
// src/database/__tests__/schema.test.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Checkout schema', () => {
  it('can create and retrieve a Cart record', async () => {
    const cart = await prisma.cart.create({ data: { sessionId: 'test-session-001' } });
    expect(cart.id).toBeDefined();
    expect(cart.sessionId).toBe('test-session-001');
    await prisma.cart.delete({ where: { id: cart.id } });
  });
});
```
