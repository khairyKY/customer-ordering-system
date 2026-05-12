# Phase 1 – Traceability Heatmap (Payment Slice)

## Overview

This document maps each functional requirement of the Payment Slice to its feature implementation and provides the logical or mathematical justification behind each requirement.

---

## Traceability Table

| Requirement ID | Feature Name                  | Requirement Description                                                              | Logical / Mathematical Justification                                                                                                                        |
|----------------|-------------------------------|--------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **PAY-01**     | Secure Credential Input       | Collect and validate CC number, CVV, and expiry via PCI-compliant masks.             | **Security Baseline:** Necessary to prevent malformed data from reaching the Gateway and to ensure UI-level data integrity.                                  |
| **PAY-02**     | Tax Computation Engine        | Automatically apply a 10% tax rate to the cart subtotal.                             | **Legal Compliance:** `Total = Subtotal × 1.10` — Without this, the system violates the mandated university business rules.                                  |
| **PAY-03**     | Promo Logic                   | Validate and apply discount codes to the subtotal before tax.                        | **Business Logic:** Required to satisfy marketing requirements. `Final_Total = (Subtotal − Discount) × 1.10`                                                 |
| **PAY-04**     | Atomic Finalization           | Ensure Order status update and Payment log creation happen in a single transaction.  | **Data Integrity:** Prevents *"Ghost Orders"* — where a user is charged but the order is not marked as `PAID` in the DB.                                    |

---

## Requirement Summary

| Requirement ID | Feature Name             | Justification Category  |
|----------------|--------------------------|-------------------------|
| PAY-01         | Secure Credential Input  | Security Baseline       |
| PAY-02         | Tax Computation Engine   | Legal Compliance        |
| PAY-03         | Promo Logic              | Business Logic          |
| PAY-04         | Atomic Finalization      | Data Integrity          |

---

## Key Formulas

| Scenario                        | Formula                                      |
|---------------------------------|----------------------------------------------|
| Tax only (no discount)          | `Total = Subtotal × 1.10`                    |
| With promo code applied         | `Final_Total = (Subtotal − Discount) × 1.10` |

---

*Document scope: Payment Slice — Phase 1 Requirements Traceability & Justification*
