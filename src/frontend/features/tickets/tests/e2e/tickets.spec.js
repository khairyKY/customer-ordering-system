import { test, expect } from '@playwright/test';
import { TicketPage } from './TicketPage.pom';
import { TriagePage } from './TriagePage.pom';

test.describe('Ticket System E2E', () => {
  test('Customer submits a valid ticket and sees 201 confirmation', async ({ page }) => {
    const ticketPage = new TicketPage(page);
    await ticketPage.navigate();
    await ticketPage.submitTicket('Valid Subject', 'This is a valid ticket body of sufficient length.');
    await expect(ticketPage.successMessage).toBeVisible();
    await expect(ticketPage.successMessage).toContainText('Ticket created successfully');
  });

  test('Customer submits duplicate ticket and sees error message', async ({ page }) => {
    const ticketPage = new TicketPage(page);
    await ticketPage.navigate();
    
    // First submission
    await ticketPage.submitTicket('Duplicate Subject', 'Body for duplicate test purpose.');
    await expect(ticketPage.successMessage).toBeVisible();

    // Duplicate submission
    await ticketPage.submitTicket('Duplicate Subject', 'Body for duplicate test purpose.');
    await expect(ticketPage.errorMessage).toBeVisible();
    await expect(ticketPage.errorMessage).toContainText('Duplicate ticket');
  });

  test('Agent views triage queue sorted by priority', async ({ page }) => {
    const triagePage = new TriagePage(page);
    await triagePage.navigate();
    
    // Assuming the system is seeded or previous tests created tickets
    const topPriority = await triagePage.getTopTicketPriority();
    expect(['CRITICAL', 'HIGH']).toContain(topPriority);
  });

  test('Agent updates ticket status from OPEN to IN_PROGRESS', async ({ page }) => {
    const triagePage = new TriagePage(page);
    await triagePage.navigate();
    
    // Find a ticket that is OPEN (using mock ID or first row)
    const ticketId = await triagePage.ticketRows.first().getAttribute('data-ticket-id');
    await triagePage.updateStatus(ticketId, 'IN_PROGRESS');
    
    // Verify update (assuming UI reflects change)
    await expect(triagePage.page.locator(\[data-ticket-id=\"\\"] select\)).toHaveValue('IN_PROGRESS');
  });
});
