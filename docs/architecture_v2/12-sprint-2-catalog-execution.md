# Sprint 2 — Golden Implementation Prompt

## "The Core Loop: View Catalog → Add to Cart → Modify Quantity"

---

## Role & Context

You are an expert Full-Stack Developer implementing **Sprint 2** of the CSE323 Customer Ordering System. You are strictly adhering to Test-Driven Prompting (TDP).

This sprint expands the vertical slice: **A user can view a grid of mock products on the Main Page, add specific products to their cart, change the quantity of items in the cart, and remove items entirely.**

There is still **no authentication** in this sprint. Continue using the hardcoded `session_id = "dev-session"`.

---

## Project Structure (Expected Updates)

```text
project-root/
├── src/
│   ├── backend/
│   │   ├── controllers/
│   │   │   ├── cartController.js  ← MODIFY THIS
│   │   │   └── productController.js ← BUILD THIS
│   │   ├── routes/
│   │   │   ├── cartRoutes.js      ← MODIFY THIS
│   │   │   └── productRoutes.js   ← BUILD THIS
│   ├── database/
│   │   └── schema.sql             ← MODIFY THIS
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── CartWidget.jsx ← MODIFY THIS
│       │   │   └── ProductGrid.jsx ← BUILD THIS
│       │   ├── api/
│       │   │   ├── cartApi.js     ← MODIFY THIS
│       │   │   └── productApi.js  ← BUILD THIS
│       │   └── App.jsx            ← MODIFY THIS (Add layout for both components)

```

---

## Backend: Changes Required

- **Task B1: Product Schema & Mock Data**
- Update `src/database/schema.sql` to include a Products table.
- Seed the database/memory with 6 mock products (e.g., "Wireless Mouse", "Mechanical Keyboard", "Gaming Monitor") with prices and stock limits.

- **Task B2: Product & Cart Endpoints**
- Create `GET /api/products` to return the catalog.
- Update `POST /api/cart/add` to validate against product stock.
- Create `PUT /api/cart/update` accepting `{ product_id, new_quantity }`.
- Create `DELETE /api/cart/remove` accepting `{ product_id }`.

---

## Frontend: Full Implementation Required

- **Task F1: API Integrations**
- Create `productApi.js` to fetch the catalog.
- Update `cartApi.js` with the new update/remove endpoints.

- **Task F2: Product Grid Component**
- Build `ProductGrid.jsx`.
- Fetch and display the 6 mock products in a responsive grid.
- Each product card must have an "Add to Cart" button.

- **Task F3: Advanced Cart Features**
- Update `CartWidget.jsx`.
- Replace the "Test Add Item" button with real data passed from the Product Grid.
- Add `+` and `-` buttons next to cart items to update quantity.
- Add a Remove button (trash icon) to delete items.

---

## API Reference (Sprint 2 Endpoints)

| Method     | Path               | Body                                        | Response                                      |
| ---------- | ------------------ | ------------------------------------------- | --------------------------------------------- |
| **GET**    | `/api/products`    | —                                           | `[{ id, name, price, stock, image_url }]`     |
| **PUT**    | `/api/cart/update` | `{ product_id: string, new_quantity: int }` | `{ success: true, cart: { ...updatedCart } }` |
| **DELETE** | `/api/cart/remove` | `{ product_id: string }`                    | `{ success: true, cart: { ...updatedCart } }` |

---

## Definition of Done — Sprint 2

### Backend

- [ ] `GET /api/products` returns the 6 mock products.
- [ ] Cart updates properly recalculate the subtotal and 10% tax.
- [ ] Attempting to update a quantity past the stock limit returns a 400 Bad Request or handled error.

### Frontend

- [ ] `ProductGrid` and `CartWidget` are rendered side-by-side or in a logical layout in `App.jsx`.
- [ ] Clicking "Add to Cart" on a product updates the Cart UI immediately.
- [ ] Quantity toggles and Remove buttons work flawlessly without requiring a page refresh.

---
