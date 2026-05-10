# 07 — Checkout & Shopping Cart Feature Scope

## Ownership

**Owner:** Member A — Full-Stack Owner
**Slice Directory:** `src/frontend/src/features/checkout/` and `src/backend/src/features/checkout/`

No other team member may modify files within these directories without a formal RFC documented in `.ai/CONTEXT.md`.

---

## In Scope

| Area | Description |
|---|---|
| **Cart State Management** | Add, update, remove, clear items |
| **Cart Persistence** | Authenticated users: DB-backed; Guests: session-based with DB migration on login |
| **Cart UI** | Drawer/sidebar, item list, quantity controls, price summary |
| **Promo Codes** | Application and validation (percentage and fixed discount types) |
| **Checkout Flow** | Multi-step: Cart Review → Shipping → Payment → Confirmation |
| **Shipping Form** | Address collection with validation |
| **Payment Form** | Simulated — no real payment gateway required |
| **Order Placement** | Converting cart → Order record in database |
| **Order Confirmation** | Confirmation page with order details |
| **Backend API** | All REST endpoints for cart and checkout (see API contract) |
| **Database Schema** | Cart, CartItem, Order, OrderItem, PromoCode models + migrations |
| **Unit Tests** | All service layer logic |
| **Integration Tests** | All API endpoints |
| **E2E Test** | Complete checkout happy path (Playwright) |

---

## Out of Scope

| Area | Responsible Party |
|---|---|
| Product data and product listing | Member C — catalog slice |
| User authentication and session management | Member B — auth slice |
| Order history and admin order management | Member B + C — orders slice |
| Payment gateway integration | Deferred — out of academic scope |
| Email notifications | Deferred — out of academic scope |

---

## API Contract — All Endpoints (Member A Owns)

All endpoints prefixed with `/api/v1`.

### Cart Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Optional | Get current cart (auth OR session) |
| `POST` | `/api/v1/cart/items` | Optional | Add item to cart |
| `PUT` | `/api/v1/cart/items/:itemId` | Optional | Update cart item quantity |
| `DELETE` | `/api/v1/cart/items/:itemId` | Optional | Remove item from cart |
| `DELETE` | `/api/v1/cart` | Optional | Clear entire cart |
| `POST` | `/api/v1/cart/promo` | Optional | Apply promo code |
| `DELETE` | `/api/v1/cart/promo` | Optional | Remove promo code |

### Checkout Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/checkout/validate` | Optional | Validate cart before payment |
| `POST` | `/api/v1/checkout/shipping` | Optional | Calculate shipping options |
| `POST` | `/api/v1/checkout/order` | Optional | Place order (converts cart → order) |
| `GET` | `/api/v1/checkout/confirmation/:orderId` | Optional | Get order confirmation |

Authentication is enforced via the shared `authGuard` middleware where noted. "Optional" means the endpoint accepts both authenticated users and guest sessions (via `x-session-id` header).

---

## Frontend Component Inventory

| Component | File | Description |
|---|---|---|
| `CartDrawer` | `components/CartDrawer.tsx` | Slide-in panel; focus-trapped; accessible |
| `CartItem` | `components/CartItem.tsx` | Individual item row with quantity stepper |
| `CartSummary` | `components/CartSummary.tsx` | Subtotal, discount, shipping, total; CTA button |
| `CheckoutForm` | `components/CheckoutForm.tsx` | Orchestrator component managing all checkout steps |
| `CheckoutStepper` | `components/CheckoutStepper.tsx` | Visual progress indicator for checkout steps |
| `OrderConfirmation` | `components/OrderConfirmation.tsx` | Post-order success page |
| `PaymentForm` | `components/PaymentForm.tsx` | Simulated payment form |
| `ShippingForm` | `components/ShippingForm.tsx` | Shipping address form with Zod validation |
| `PromoCodeInput` | `components/PromoCodeInput.tsx` | Promo code entry and validation UI |

---

## Checkout Step Flow

```
Cart Review → Shipping Information → Payment → Order Confirmation
   (cart)         (shipping)         (payment)    (confirmation)
```

State managed by `CheckoutForm`:
```typescript
interface CheckoutState {
  step: CheckoutStep;       // 'cart' | 'shipping' | 'payment' | 'confirmation'
  cart: Cart;
  shippingData: ShippingAddress | null;
  paymentRef: string | null;
}
```

---

## TypeScript Types — Checkout Domain

```typescript
// src/frontend/src/features/checkout/types/checkout.types.ts

export interface CartItem {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'imageUrl' | 'price'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  itemCount: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CheckoutFormData {
  shipping: ShippingAddress;
  paymentRef: string; // Simulated — real token in production
}

export interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
  placedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';
```

---

## Shared Type Dependencies (Read-Only)

The checkout slice depends on the following type from `src/frontend/src/shared/types/`:

```typescript
// src/frontend/src/shared/types/product.types.ts (coordinated with Member C)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}
```

> This type is **frozen** once consumed by checkout. Any changes require an RFC.
