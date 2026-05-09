# Persona Discovery: Edge Case Contributions
**System:** Customer Ordering System
**Deliverable:** Phase 1 (D2 - Requirements)
**Contributor:** Member A (UI Layer Focus)

---

### Edge Case 1: The Desperate Double-Clicker (State Locking)
*   **Avatar Persona:** The Impatient / Lagging Customer.
*   **Scenario:** The customer is on a slow 3G mobile connection. They hit "Place Order", nothing happens immediately, so they furiously tap the button 5 more times in frustration.
*   **UI Requirement:** The frontend must implement strict state-locking and debouncing. On the first click, the UI state must instantly disable the button and render a loading state (spinner/overlay) to physically prevent the user from sending duplicate POST requests to the API and double-charging their card.

### Edge Case 2: The Stale Cart Ghost (Concurrency)
*   **Avatar Persona:** The Distracted Window-Shopper.
*   **Scenario:** The customer adds the last available "Signature Espresso" to their cart, opens a new tab to check something, and leaves the checkout screen sitting there for 20 minutes. Meanwhile, someone else buys the last espresso. The customer returns and hits "Pay".
*   **UI Requirement:** The UI cannot assume the cart is still valid. Upon hitting "Pay", if the backend throws a 409 Conflict or 400 Bad Request regarding inventory, the UI must intercept this error gracefully. Instead of crashing, it must trigger a specific modal informing the user the item sold out, and force a cart refresh.
