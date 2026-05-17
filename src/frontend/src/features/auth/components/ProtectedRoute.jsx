import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';

/**
 * Wrap a route element to require auth (and optionally a specific role).
 *
 *   <Route element={<ProtectedRoute role="admin" />}>
 *     <Route path="/orders" element={<OrderListPage />} />
 *   </Route>
 */
export default function ProtectedRoute({ role, children }) {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }
    if (role && user?.role !== role) {
        // Hierarchy: admin can access agent routes, etc. — but we keep it strict here.
        return <Navigate to="/forbidden" replace />;
    }
    return children ?? null;
}
