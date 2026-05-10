# Sprint 1 — Golden Implementation Prompt

## "The Core Loop: Type → Save → Checkout Integration"

---

# Role & Context

You are an expert Full-Stack Developer implementing **Sprint 1** of the CSE323 Customer Ordering System. You are strictly adhering to Test-Driven Prompting (TDP).

This sprint delivers a single, end-to-end vertical slice: **A user can view an empty shopping cart, add a mock product to the cart, have the backend calculate the total (including simulated tax), and return the updated cart state to the UI.**

There is **no authentication** or payment gateway integration in this sprint. All users share a hardcoded `session_id = "dev-session"`. 

---

# Project Structure (Expected)

```text
project-root/
├── src/
│   ├── backend/
│   │   ├── controllers/
│   │   │   └── cartController.js  ← BUILD THIS
│   │   ├── routes/
│   │   │   └── cartRoutes.js      ← BUILD THIS
│   │   └── server.js              ← MODIFY THIS
│   ├── database/
│   │   └── schema.sql             ← BUILD THIS
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   └── CartWidget.jsx ← BUILD THIS
│       │   ├── api/
│       │   │   └── cartApi.js     ← BUILD THIS
│       │   └── App.jsx            ← MODIFY THIS