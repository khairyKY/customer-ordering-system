# Testing Pyramid Strategy (70/20/10 Ratio)
Detailed breakdown of the mathematical and architectural balance for the Payment domain.

## 1. Unit Layer (70%) - 14 Scenarios
* **Mathematical Precision:** Validating 10% tax calculations (e.g., $19.99 * 1.10 = $21.99).
* **Domain Constraints:** Enforcing the $0.00 transaction floor and Zod schema padlocks for UUID idempotency.
* **Failure Paths:** Verification of proper error throwing for invalid alphanumeric regex inputs.

## 2. Integration Layer (20%) - 3 Scenarios
* **Pipeline Flow:** Verifying the clean data flow from Zod Schema -> Controller -> Logic Layer.
* **State Isolation:** Ensuring the "Edge Case Cage" processes requests without side-effect pollution.

## 3. E2E/System Layer (10%) - 3 Scenarios
* **User Journey:** Full Playwright validation of the checkout-to-confirmation sequence.
* **Trust Mechanics:** Explicit testing of double-click submission prevention and error message clarity.
