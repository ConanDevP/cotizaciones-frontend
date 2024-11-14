import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Role {
  id: number;
  documentId: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  role: Role;
}

interface AuthResponse {
  jwt: string;
  user: User;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  userRole: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const STRAPI_URL = 'http://localhost:1337/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      userRole: null,
      login: async (identifier: string, password: string): Promise<boolean> => {
        try {
          // Primera petición para obtener el token
          const response = await fetch(`${STRAPI_URL}/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password }),
          });

          if (!response.ok) return false;

          const data = await response.json() as AuthResponse;

          console.log("primera: ",data)
          // Segunda petición para obtener el usuario con el rol
          const userResponse = await fetch(`${STRAPI_URL}/users/me?populate=*`, {
            headers: {
              'Authorization': `Bearer ${data.jwt}`,
            }
          });

          console.log("segunda: ",userResponse)

          const userData = await userResponse.json();

          set({
            token: data.jwt,
            user: userData,
            isAuthenticated: true,
            userRole: userData.role?.type || null
          });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        userRole: null
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);