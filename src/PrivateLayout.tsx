import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/AuthProvider';
import Navbar from '@/components/Navbar';

export function PrivateLayout() {
    const { isAuthenticated, userRole } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (location.pathname === '/settings' && userRole !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </>
    );
}