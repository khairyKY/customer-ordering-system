/**
 * Payment Page Object Model (POM)
 * Encapsulates UI selectors and actions for the Payment slice.
 */
class PaymentPage {
  constructor(page) {
    this.page = page;
    this.cardNumberInput = page.locator('input[name="cardNumber"]');
    this.expiryInput = page.locator('input[name="expiry"]');
    this.cvvInput = page.locator('input[name="cvv"]');
    this.promoInput = page.locator('input[name="promoCode"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.successMessage = page.locator('.payment-success');
    this.errorMessage = page.locator('.payment-error');
    this.totalDisplay = page.locator('.total-amount');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async fillPaymentDetails(details) {
    await this.cardNumberInput.fill(details.cardNumber);
    await this.expiryInput.fill(details.expiry);
    await this.cvvInput.fill(details.cvv);
    if (details.promoCode) {
      await this.promoInput.fill(details.promoCode);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async getFinalTotal() {
    return await this.totalDisplay.innerText();
  }
}

module.exports = { PaymentPage };
