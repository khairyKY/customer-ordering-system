# Phase 2 – Gherkin Scripting (Payment Scenarios)

## Overview

This document defines the Behaviour-Driven Development (BDD) acceptance criteria for the Payment Slice, written in Gherkin syntax. Each scenario maps directly to requirements established in Phase 1.

---

## Scenario 1: Credit Card Processing *(Scenario Outline)*

```gherkin
Feature: Payment Processing
  As a Customer
  I want to pay for my order using a credit card
  So that I can complete my purchase successfully

  Scenario Outline: Process credit card payments with various card states
    Given a Customer is logged in with a valid JWT
    And the Cart contains items with a subtotal of $100.00
    And the mandatory tax rate is 10%
    When the Customer submits a payment with <card_status> credentials
    Then the system should return a <response_type> response
    And the transaction status should be "<final_status>"

    Examples:
      | card_status        | response_type   | final_status |
      | valid              | 201 Created     | SUCCEEDED    |
      | expired            | 422 Unprocessable | FAILED     |
      | insufficient_funds | 422 Unprocessable | FAILED     |
      | stolen             | 403 Forbidden   | REJECTED     |
```

### Scenario Trace

| Card Status          | Expected Response     | Final Status | Justification                                             |
|----------------------|-----------------------|--------------|-----------------------------------------------------------|
| `valid`              | `201 Created`         | `SUCCEEDED`  | Happy path — gateway authorizes and funds are captured.   |
| `expired`            | `422 Unprocessable`   | `FAILED`     | Card is structurally invalid; rejected before processing. |
| `insufficient_funds` | `422 Unprocessable`   | `FAILED`     | Gateway declines; no funds captured.                      |
| `stolen`             | `403 Forbidden`       | `REJECTED`   | Fraud flag raised; transaction blocked entirely.          |

---

## Scenario 2: Promo Codes & Discounts *(Edge Case)*

```gherkin
Feature: Promotional Discounts

  Scenario: Apply a promo code that exceeds the cart subtotal
    Given a Cart subtotal is $40.00
    And a Promo Code "GIANT_DISCOUNT" provides $50.00 off
    When the Customer applies the Promo Code
    Then the taxable subtotal should be clamped to $0.00
    And the 10% tax should be $0.00
    And the final total should be $0.00
```

### Calculation Breakdown

| Step                        | Formula                                      | Result   |
|-----------------------------|----------------------------------------------|----------|
| Raw subtotal after discount | `$40.00 − $50.00 = −$10.00`                  | `−$10.00`|
| Floor logic applied         | `Max(0, −$10.00)`                            | `$0.00`  |
| Tax on clamped subtotal     | `$0.00 × 1.10`                               | `$0.00`  |
| **Final total**             | `$0.00`                                      | `$0.00`  |

> **Requirement Padlock (PAY-03):** Discounts cannot reduce the taxable subtotal below zero. Guards against negative totals crashing the tax engine — see *The Gift-Card Loop* in Phase 1 Persona Discovery.

---

## Scenario 3: Mandatory Tax Calculation

```gherkin
Feature: Tax Compliance

  Scenario: Explicit verification of 10% tax application
    Given a Cart subtotal is $200.00 after discounts
    When the Payment calculation engine runs
    Then the calculated tax must be exactly $20.00
    And the total amount charged to the Customer must be $220.00
```

### Calculation Breakdown

| Step              | Formula                   | Result   |
|-------------------|---------------------------|----------|
| Subtotal          | —                         | `$200.00`|
| Tax (10%)         | `$200.00 × 0.10`          | `$20.00` |
| **Total charged** | `$200.00 × 1.10`          | `$220.00`|

> **Requirement Padlock (PAY-02):** Legal compliance — `Total = Subtotal × 1.10`. The tax must be exactly computable and auditable for every transaction.

---

## Scenario Coverage Summary

| Scenario | Feature             | Type              | Linked Requirement |
|----------|---------------------|-------------------|--------------------|
| 1        | Credit Card Processing | Scenario Outline | PAY-01             |
| 2        | Promo Code Edge Case   | Edge Case        | PAY-03             |
| 3        | Tax Calculation        | Compliance Check | PAY-02             |

---

*Document scope: Payment Slice — Phase 2 BDD Acceptance Criteria (Gherkin)*
