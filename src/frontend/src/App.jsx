// COS — Member D admin app entry. Routes auth + orders + inventory.
//
// NOTE: Member A's original CartWidget + ProductGrid are intentionally NOT
// mounted here. They lived at "/" in the prior single-page App.jsx. If you
// need to bring them back, add a /checkout route that imports those components.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import './index.css';

import ProtectedRoute from './features/auth/components/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import OrderListPage from './features/orders/pages/OrderListPage';
import OrderDetailPage from './features/orders/pages/OrderDetailPage';
import InventoryPage from './features/orders/pages/InventoryPage';
import Layout from './features/shared/Layout';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected — admin only */}
                <Route
                    element={
                        <ProtectedRoute role="admin">
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/" element={<Navigate to="/orders" replace />} />
                    <Route path="/orders" element={<OrderListPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                </Route>

                {/* Forbidden / fallback */}
                <Route
                    path="/forbidden"
                    element={
                        <div className="auth-card">
                            <h1>403 — Forbidden</h1>
                            <p>Admin role required for this page.</p>
                        </div>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
