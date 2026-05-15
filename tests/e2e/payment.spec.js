const { test, expect } = require('@playwright/test');
const { PaymentPage } = require('./pages/payment.page');

test.describe('Payment E2E Validation (Pyramid: 10%)', () => {

  test('Should successfully process a standard payment (Validation: Success Path)', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto();

    await paymentPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiry: '12/26',
      cvv: '123'
    });

    await paymentPage.submit();

    await expect(paymentPage.successMessage).toBeVisible();
    await expect(paymentPage.successMessage).toContainText('Payment Successful');
  });

  test('Should reject duplicate submission (Validation: User Trust)', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto();

    await paymentPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiry: '12/26',
      cvv: '123'
    });

    // Simulate rapid double-click
    await paymentPage.submit();
    await expect(paymentPage.submitButton).toBeDisabled(); // Optimistic UI padlock
    
    await expect(paymentPage.successMessage).toBeVisible();
  });

  test('Should show validation error for malformed promo code (Validation: Clarity)', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.goto();

    await paymentPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiry: '12/26',
      cvv: '123',
      promoCode: 'INVALID-!@#'
    });

    await paymentPage.submit();

    await expect(paymentPage.errorMessage).toBeVisible();
    await expect(paymentPage.errorMessage).toContainText('Alphanumeric only');
  });
});
