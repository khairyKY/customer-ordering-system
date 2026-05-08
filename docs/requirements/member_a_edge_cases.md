# Persona Discovery: Checkout Edge Cases
**Owner:** Member A (Khairy)

1. **The Stale Cart:** Customer leaves the checkout page open for an hour. An item sells out in the database before they click pay. The backend must reject the POST request and force a UI cart refresh.
2. **The Desperate Double-Clicker:** Customer is on slow 3G and hits 'Submit Order' 5 times. The React UI must instantly disable the button to prevent duplicate database entries.
