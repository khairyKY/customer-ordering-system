Feature: Payment Validation
  As a customer
  I want a secure and clear payment process
  So that I can complete my order with confidence

  Scenario: Successful Payment with 10% Tax
    Given I have items in my cart totaling $100.00
    And I am on the Payment Page
    When I enter valid credit card details
    And I click "Submit Payment"
    Then the system should calculate a $10.00 tax
    And I should see a success message with the final total "$110.00"

  Scenario: Duplicate Charge Prevention
    Given I have already submitted a payment with Key "UUID-123"
    When I attempt to submit the exact same payment again
    Then the system should block the second transaction
    And I should see a message confirming the payment was already processed
    And my card should not be charged twice

  Scenario: Invalid Promo Code Handling
    Given I enter a promo code with special characters "SAVE20!"
    When I submit the payment
    Then the UI should display "Alphanumeric only"
    And the transaction should not proceed to the gateway
