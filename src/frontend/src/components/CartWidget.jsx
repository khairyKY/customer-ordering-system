// ============================================================
// CartWidget — Dev-Cosmic wrapper (legacy compatibility shim)
// The cart UI logic has been promoted to CartPage.jsx which
// implements the full terminal-style cart table from the
// stitch_cart_checkout Stitch export.
// This shim is preserved so any existing imports / Playwright
// tests that reference 'components/CartWidget' continue to resolve.
// ============================================================
import CartPage from './CartPage';
export default CartPage;
