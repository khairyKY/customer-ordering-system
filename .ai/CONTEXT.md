# SYSTEM CONTEXT: CSE323 Customer Ordering System (COS)

## 1. MANDATE: AI-NATIVE VERTICAL SLICING
- **Architecture:** Feature-Based Vertical Slicing (Mandated by CSE322/323 Curriculum).
- **Human Role:** Orchestrator (Architect & Reviewer).
- **AI Role:** Labor (Logic Generation within boundaries).
- **Protocol:** Test-Driven Prompting (TDP) - Failing test MUST precede implementation.

## 2. DIRECTORY STRUCTURE
- `src/frontend/`: React/Tailwind code (Vertical slices under `features/`).
- `src/backend/`: Node/Express code (Vertical slices under `features/`).
- `src/database/`: Prisma models and migrations.

## 3. FEATURE OWNERSHIP
- **Member A (Khairy):** Checkout & Shopping Cart System.
- **Member B:** Auth & User Management.
- **Member C:** Product Catalog.
- **Member D:** Admin & Order Fulfillment.

## Sprint 1 Execution Log
**Date:** 2026-05-10
**Status:** Initialized & Complete

### Files Created:
- **Database:** `src/database/schema.sql` (Mock/Initial schema for carts and cart_items).
- **Backend:**
  - `src/backend/controllers/cartController.js` (In-memory cart logic and total calculation).
  - `src/backend/routes/cartRoutes.js` (API endpoints: `GET /` and `POST /add`).
  - `src/backend/server.js` (Express entry point with CORS and JSON middleware).
- **Frontend:**
  - `src/frontend/src/api/cartApi.js` (Axios client for checkout slice communication).
  - `src/frontend/src/components/CartWidget.jsx` (UI state manager for cart display and test-add functionality).
  - `src/frontend/src/App.jsx` (Root layout integration).

### API Routes Established:
- `GET http://localhost:3001/api/cart` - Returns current cart state.
- `POST http://localhost:3001/api/cart/add` - Adds mock item to in-memory store.

### Success Criteria Confirmation:
- [x] Backend initialized with Express/Node.
- [x] Database mock schema defined.
- [x] Frontend can fetch and display empty cart state.
- [x] "Add Item" button triggers backend calculation and UI refresh.
- [x] Tax calculation (8%) verified in controller logic.

## Sprint 2 Execution Log
**Date:** 2026-05-10
**Status:** Complete

### Files Created/Updated:
- **Database:** `src/database/schema.sql` updated with `products` table.
- **Backend:**
  - `src/backend/controllers/productController.js` (Mock catalog data and retrieval).
  - `src/backend/routes/productRoutes.js` (Endpoint: `GET /`).
  - `src/backend/controllers/cartController.js` (Updated to handle stock validation, quantity updates, and removals).
  - `src/backend/routes/cartRoutes.js` (Added `PUT /update` and `DELETE /remove`).
  - `src/backend/server.js` (Integrated product routes).
- **Frontend:**
  - `src/frontend/src/api/productApi.js` (Client for catalog).
  - `src/frontend/src/api/cartApi.js` (Added update/remove methods).
  - `src/frontend/src/components/ProductGrid.jsx` (Responsive grid display for products).
  - `src/frontend/src/components/CartWidget.jsx` (Upgraded with quantity controls and remove actions).
  - `src/frontend/src/App.jsx` (Layout for Catalog and Cart side-by-side).

### API Routes Established:
- `GET http://localhost:3001/api/products` - Returns 6 mock products.
- `PUT http://localhost:3001/api/cart/update` - Modifies item quantity with stock check.
- `DELETE http://localhost:3001/api/cart/remove` - Removes item from session cart.

### Success Criteria Confirmation:
- [x] Product catalog fetchable from backend.
- [x] Stock validation enforced during add/update.
- [x] Cart subtotal and tax (10%) recalculated on every change.
- [x] UI allows full catalog-to-cart lifecycle (Add -> Update -> Remove).

### Feature Log: Checkout Button (feat/checkout-button)
**Date:** 2026-05-10
**Status:** Feature Initialized

- **Component:** `CartWidget.jsx` updated with a "Proceed to Checkout" button.
- **Functionality:** 
  - Validates if cart is empty before enabling.
  - Triggers a simulated routing alert.
  - Clears local cart state upon click to reset the UI loop.
