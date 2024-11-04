import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import QuotationForm from '@/components/QuotationForm';
import QuotationList from '@/components/QuotationList';
import LoginForm from '@/components/LoginForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        {isAuthenticated && <Navbar />}
        <main className={isAuthenticated ? 'container mx-auto px-4 py-8' : ''}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <QuotationList />
              </ProtectedRoute>
            } />
            <Route path="/new" element={
              <ProtectedRoute>
                <QuotationForm />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;