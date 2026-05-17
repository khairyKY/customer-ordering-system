// Routes:
//   /                          → Member A's cart/catalog (unchanged)
//   /admin/login               → Member D's login
//   /admin/register            → Member D's register
//   /admin/orders              → Member D's order list (admin-only)
//   /admin/orders/:id          → Member D's order detail (admin-only)
//   /admin/inventory           → Member D's inventory (admin-only)

import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProductGrid from './components/ProductGrid';
import CartWidget from './components/CartWidget';

import ProtectedRoute from './features/auth/components/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import OrderListPage from './features/orders/pages/OrderListPage';
import OrderDetailPage from './features/orders/pages/OrderDetailPage';
import InventoryPage from './features/orders/pages/InventoryPage';
import Layout from './features/shared/Layout';

function CheckoutHome() {
    const [cart, setCart] = useState(null);
    return (
        <main className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    CSE323 Customer Ordering System
                </h1>
                <p className="text-gray-600 mt-2">Feature-Based Vertical Slicing Demo</p>
                <a
                    href="/admin/login"
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                >
                    Admin login →
                </a>
            </header>
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
                <section className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 uppercase">
                        Product Catalog
                    </h2>
                    <ProductGrid onCartUpdate={setCart} />
                </section>
                <aside className="lg:w-96 sticky top-8">
                    <CartWidget cart={cart} onCartUpdate={setCart} />
                </aside>
            </div>
        </main>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Member A — checkout/cart at root */}
                <Route path="/" element={<CheckoutHome />} />

                {/* Member D — admin auth (public) */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin/register" element={<RegisterPage />} />

                {/* Member D — admin (protected) */}
                <Route
                    element={
                        <ProtectedRoute role="admin">
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
                    <Route path="/admin/orders" element={<OrderListPage />} />
                    <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/admin/inventory" element={<InventoryPage />} />
                </Route>

                {/* Forbidden + 404 fallback */}
                <Route
                    path="/forbidden"
                    element={
                        <div className="auth-card">
                            <h1>403 — Forbidden</h1>
                            <p>Admin role required.</p>
                        </div>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
