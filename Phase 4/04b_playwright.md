# CSE323 — Ticket System | Phase 4 Deliverable D4

## 04b: Playwright E2E Scripts (Page Object Model)

**Member:** C — Ticket System Vertical Slice
**Rubric Target:** Excellent (Full Marks)
**Location:** `src/frontend/features/tickets/tests/e2e/`

---

## Gherkin → Playwright Mapping

| Gherkin Scenario | Playwright Test | POM Used |
| ---------------- | --------------- | -------- |
| F1-S1: Customer submits valid ticket | `Customer submits a valid ticket and sees confirmation` | `TicketPage` |
| F7-S1: Duplicate submission → 409 | `Customer submits duplicate ticket and sees error message` | `TicketPage` |
| F4-S1: Agent triage queue sorted by priority | `Agent views triage queue sorted by priority` | `TriagePage` |
| F5-S1: OPEN → IN_PROGRESS transition | `Agent updates ticket status from OPEN to IN_PROGRESS` | `TriagePage` |

---

## TicketPage.pom.js

**Location:** `src/frontend/features/tickets/tests/e2e/TicketPage.pom.js`

```javascript
export class TicketPage {
  constructor(page) {
    this.page = page;

    // Locators — aligned with Phase 2 API contract field names (subject, body)
    this.subjectInput   = page.locator('input[name="subject"]');
    this.bodyInput      = page.locator('textarea[name="body"]');
    this.submitButton   = page.locator('button[type="submit"]');
    this.successMessage = page.locator('.alert-success');
    this.errorMessage   = page.locator('.alert-error');
  }

  async navigate() {
    await this.page.goto('/tickets/new');
  }

  async submitTicket(subject, body) {
    await this.subjectInput.fill(subject);
    await this.bodyInput.fill(body);
    await this.submitButton.click();
  }
}
```

---

## TriagePage.pom.js

**Location:** `src/frontend/features/tickets/tests/e2e/TriagePage.pom.js`

```javascript
export class TriagePage {
  constructor(page) {
    this.page = page;

    // Locators — aligned with Phase 2 FR-04 triage queue contract
    this.ticketRows    = page.locator('.triage-row');
    this.priorityCells = page.locator('.priority-cell');
    this.statusDropdown = page.locator('select[name="status"]');
  }

  async navigate() {
    await this.page.goto('/tickets/triage');
  }

  async updateStatus(ticketId, status) {
    const row = this.page.locator(`[data-ticket-id="${ticketId}"]`);
    await row.locator('select[name="status"]').selectOption(status);
  }

  async getTopTicketPriority() {
    return await this.priorityCells.first().innerText();
  }
}
```

---

## tickets.spec.js

**Location:** `src/frontend/features/tickets/tests/e2e/tickets.spec.js`

```javascript
import { test, expect } from '@playwright/test';
import { TicketPage }  from './TicketPage.pom';
import { TriagePage }  from './TriagePage.pom';

test.describe('Ticket System — E2E Scenarios', () => {

  // ---------------------------------------------------------------------------
  // Scenario 1 — FR-01: Customer submits a valid ticket (Gherkin: F1-S1)
  // ---------------------------------------------------------------------------
  test('Customer submits a valid ticket and sees confirmation', async ({ page }) => {
    const ticketPage = new TicketPage(page);
    await ticketPage.navigate();

    await ticketPage.submitTicket(
      'My order has not arrived',
      'I placed order #8821 five days ago and have received no dispatch email.',
    );

    await expect(ticketPage.successMessage).toBeVisible();
    await expect(ticketPage.successMessage).toContainText('Ticket created successfully');
  });

  // ---------------------------------------------------------------------------
  // Scenario 2 — EC-2: Duplicate submission triggers 409 error (Gherkin: F7-S1)
  // ---------------------------------------------------------------------------
  test('Customer submits duplicate ticket and sees error message', async ({ page }) => {
    const ticketPage = new TicketPage(page);
    await ticketPage.navigate();

    const subject = 'Duplicate Subject';
    const body    = 'Body for duplicate test — sufficient length for validation.';

    // First submission — should succeed
    await ticketPage.submitTicket(subject, body);
    await expect(ticketPage.successMessage).toBeVisible();

    // Navigate back and submit identical ticket — should be rejected
    await ticketPage.navigate();
    await ticketPage.submitTicket(subject, body);
    await expect(ticketPage.errorMessage).toBeVisible();
    await expect(ticketPage.errorMessage).toContainText('Duplicate ticket');
  });

  // ---------------------------------------------------------------------------
  // Scenario 3 — FR-04: Agent triage queue sorted by priority (Gherkin: F4-S1)
  // ---------------------------------------------------------------------------
  test('Agent views triage queue sorted by priority', async ({ page }) => {
    const triagePage = new TriagePage(page);
    await triagePage.navigate();

    // Top ticket must be CRITICAL or HIGH — never MEDIUM or LOW
    const topPriority = await triagePage.getTopTicketPriority();
    expect(['CRITICAL', 'HIGH']).toContain(topPriority);
  });

  // ---------------------------------------------------------------------------
  // Scenario 4 — FR-05: Agent updates ticket status OPEN → IN_PROGRESS (Gherkin: F5-S1)
  // ---------------------------------------------------------------------------
  test('Agent updates ticket status from OPEN to IN_PROGRESS', async ({ page }) => {
    const triagePage = new TriagePage(page);
    await triagePage.navigate();

    const ticketId = await triagePage.ticketRows.first().getAttribute('data-ticket-id');
    await triagePage.updateStatus(ticketId, 'IN_PROGRESS');

    const statusSelect = triagePage.page.locator(
      `[data-ticket-id="${ticketId}"] select[name="status"]`
    );
    await expect(statusSelect).toHaveValue('IN_PROGRESS');
  });

});
```

---

## Faults Fixed

| # | Location | Fault | Fix |
|---|----------|-------|-----|
| 1 | `tickets.spec.js` — Scenario 1 | Subject `"Valid Subject"` is only 13 chars — passes validation but is not realistic | Replaced with real Phase 1 persona content matching FR-01 happy path |
| 2 | `tickets.spec.js` — Scenario 1 | Body `"This is a valid ticket body of sufficient length."` is generic | Replaced with Alex's actual use case from Phase 1 |
| 3 | `tickets.spec.js` — Scenario 2 | After first submission the page was not navigated back before second submission | Added `await ticketPage.navigate()` between first and second submission |
| 4 | `tickets.spec.js` — Scenario 2 | Body `"Body for duplicate test purpose."` is only 32 chars — barely above minimum | Replaced with a more realistic body that clearly exceeds the 10-char minimum |
| 5 | `tickets.spec.js` — Scenario 3 | `test.describe` block label was generic `'Ticket System E2E'` | Renamed to `'Ticket System — E2E Scenarios'` for clarity |
| 6 | All files | No Gherkin → Playwright mapping table | Added mapping table at the top linking each test to its Gherkin scenario ID |
| 7 | `TicketPage.pom.js` | No comments explaining locator naming rationale | Added comment confirming alignment with Phase 2 API contract field names |

---

*Phase 4b — Playwright E2E Scripts | CSE323 D4 | Member C — Ticket System*
