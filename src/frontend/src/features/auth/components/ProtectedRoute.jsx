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
        // Strict equality on purpose — no role hierarchy. An "admin" user
        // does NOT automatically satisfy `role="agent"` (or vice versa);
        // if you wrap /tickets/triage with <ProtectedRoute role="agent"/>
        // an admin will be sent to /forbidden. Decide at the call site
        // which role the route requires.
        return <Navigate to="/forbidden" replace />;
    }
    return children ?? null;
}
