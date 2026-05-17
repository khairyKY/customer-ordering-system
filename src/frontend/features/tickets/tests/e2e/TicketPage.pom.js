export class TicketPage {
  constructor(page) {
    this.page = page;
    this.subjectInput = page.locator('input[name=\"subject\"]');
    this.bodyInput = page.locator('textarea[name=\"body\"]');
    this.submitButton = page.locator('button[type=\"submit\"]');
    this.successMessage = page.locator('.alert-success');
    this.errorMessage = page.locator('.alert-error');
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
