# Testing Pyramid Strategy (70/20/10 Ratio)
Detailed breakdown of the mathematical and architectural balance for the Payment domain.

## 1. Unit Layer (70%) - 14 Scenarios
The unit layer provides the "Edge Case Cage," enforcing strict mathematical and structural boundaries in isolation.

| Test Name | Engineering Boundary Enforced 
| :--- | :--- | :--- |
| **Standard Tax Calculation** | Validates exactly 10% tax on round subtotals (e.g., $100 -> $110). 
| **Floating Point Precision** | Ensures tax calculation handles floating-point errors (e.g., $19.99 case). 
| **Negative Amount (Logic)** | Ensures the logic layer throws `InvalidAmountError` for negative values. 
| **Promo Discount Floor** | Enforces a hard $0.00 floor if discounts exceed the subtotal (REQ_EC_4). 
| **Minimum Value Threshold** | Validates correct behavior at the smallest possible currency unit ($0.01). 
| **Schema Positive Enforcement**| Uses Zod to structurally block non-positive amounts at the network edge. 
| **Decimal Precision Guard** | Blocks any amounts with more than 2 decimal places to prevent math drift. 
| **UUID Format Validation** | Prevents processing if the Idempotency Key is not a valid UUID string. 
| **Promo Regex Constraint** | Rejects promo codes containing special characters (Alphanumeric only). 
| **Promo Length Threshold** | Enforces a strict maximum length of 20 characters for promotional inputs. 
| **Double Charge Prevention** | Verifies that duplicate Idempotency Keys return cached transaction IDs.
| **Logic Key Validation** | Validates that the internal logic layer rejects requests with missing keys. 
| **Logic Amount Validation** | Redundant logic-layer check for invalid amount signatures. 
| **Cart Total Non-Negative** | Ensures the `cartTotal` field cannot be negative via Zod `.refine()`. 

File Path: | `src/backend/features/payment/payment.test.js` |

## 2. Integration Layer (20%) - 3 Scenarios
Verifies the "Handshake" between the Schema, Controller, and Logic components.

*   **Full Pipeline Flow:** Verifies data travels correctly from Schema -> Controller -> Logic without loss.
*   **Schema Barrier Verification:** Confirms that invalid data is blocked *before* hitting business logic.
*   **State Isolation:** Ensures that multiple concurrent payment attempts maintain independent transaction states.

## 3. E2E/System Layer (10%) - 3 Scenarios
Validates real-world User Journeys and business value (User Trust).

*   **Successful Checkout Journey:** Full validation from checkout entry to the "Payment Successful" message.
*   **Trust Mechanics (Double-Click):** Validates that the UI disables the submit button to prevent double billing.
*   **Validation Clarity:** Ensures user-friendly error messages (e.g., "Alphanumeric only") are visible on the UI.

### Page Object Model (POM) Implementation
E2E tests utilize the **Page Object Model** located at `tests/e2e/pages/payment.page.js`. This encapsulates UI selectors and actions (like `fillPaymentDetails` and `submit`), ensuring that test specs remain readable and resilient to UI changes.
