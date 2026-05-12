# Phase 1 – Actor Classification (Payment Slice)

## Overview

This document identifies and classifies all actors involved in the Payment Slice of the system, categorized by their level of interaction with the payment flow.

---

## Actor Classification Table

| Actor Category | Entity                          | Rationale                                                                                                                                                                  |
|----------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Primary**    | Customer                        | The initiator of the pay intent. They interact with the UI to provide payment credentials and authorize the transfer of funds.                                              |
| **Supporting** | Payment Gateway *(e.g., Stripe)*| A downstream external system that performs the actual credit card validation and fund capture. Our system acts as a **Client** to their API.                                |
| **Supporting** | Internal Database               | Responsible for persisting transaction logs, updating order status to `PAID`, and ensuring atomicity (ACID) during the checkout finalization.                               |
| **Offstage**   | Accounting Dept.                | Requires immutable transaction reports for end-of-month reconciliation. They do not interact with the payment flow directly but rely on its data integrity.                 |
| **Offstage**   | Tax Authorities                 | Passive stakeholders in the mandatory **10% tax rate** calculation. The system must prove that tax was correctly captured for every transaction.                            |

---

## Actor Category Definitions

| Category      | Description                                                                                  |
|---------------|----------------------------------------------------------------------------------------------|
| **Primary**   | Directly initiates or drives the use case. The main user of the system feature.              |
| **Supporting**| External systems or services that the primary flow depends on to complete its goal.           |
| **Offstage**  | Stakeholders with no direct interaction in the flow, but who have interests in its outcomes. |

---

*Document scope: Payment Slice — Phase 1 Requirements & Actor Analysis*
