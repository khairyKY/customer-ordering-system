export class TriagePage {
  constructor(page) {
    this.page = page;
    this.ticketRows = page.locator('.triage-row');
    this.priorityCells = page.locator('.priority-cell');
    this.statusDropdown = page.locator('select[name=\"status\"]');
  }

  async navigate() {
    await this.page.goto('/tickets/triage');
  }

  async updateStatus(ticketId, status) {
    const row = this.page.locator(\[data-ticket-id=\"\\"]\);
    await row.locator('select[name=\"status\"]').selectOption(status);
  }

  async getTopTicketPriority() {
    return await this.priorityCells.first().innerText();
  }
}
