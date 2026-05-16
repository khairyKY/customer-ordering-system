import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../auth/store/authStore';

export default function Layout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    function onLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <Link to="/" className="brand">COS · Admin</Link>

                <nav>
                    <NavLink to="/orders"   data-testid="nav-orders">Orders</NavLink>
                    <NavLink to="/inventory" data-testid="nav-inventory">Inventory</NavLink>
                </nav>

                <div className="user-menu">
                    <span data-testid="current-user">{user?.email}</span>
                    <button onClick={onLogout} data-testid="logout">Logout</button>
                </div>
            </header>

            <main>
                <Outlet />
            </main>
        </div>
    );
}
