import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    userRole: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const userRole = useAuthStore((state) => state.userRole);

    return (
        <AuthContext.Provider value={{ isAuthenticated, userRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
