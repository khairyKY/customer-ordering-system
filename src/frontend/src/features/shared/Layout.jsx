import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../auth/store/authStore';

const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded font-medium transition-colors ${
        isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100'
    }`;

export default function Layout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    function onLogout() {
        logout();
        navigate('/admin/login');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex items-center gap-8 px-8 py-4 bg-white border-b border-gray-200">
                <Link to="/" className="text-lg font-bold text-gray-900 hover:text-blue-600">
                    COS · Admin
                </Link>

                <nav className="flex gap-2 flex-1">
                    <NavLink to="/admin/orders"    className={navLinkClass} data-testid="nav-orders">
                        Orders
                    </NavLink>
                    <NavLink to="/admin/inventory" className={navLinkClass} data-testid="nav-inventory">
                        Inventory
                    </NavLink>
                </nav>

                <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600" data-testid="current-user">{user?.email}</span>
                    <Button variant="secondary" onClick={onLogout} className="text-sm" data-testid="logout">
                        Logout
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
