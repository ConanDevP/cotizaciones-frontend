import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import QuotationDetail from './components/QuotationDetail';
import QuotationForm from './components/QuotationForm';
import QuotationList from './components/QuotationList';
import LoginForm from './components/LoginForm';
import { PrivateLayout } from './PrivateLayout';
import AdminSettings from './components/AdminSettings';
import EditQuotation from './components/EditQuotation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route element={<PrivateLayout />}>
                  <Route path="/" element={<QuotationList />} />
                  <Route path="/new" element={<QuotationForm />} />
                  <Route path="/quotation/:id" element={<QuotationDetail />} />
                  <Route path="/edit/:id" element={<EditQuotation />} />
                  <Route path="/settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </div>
          </BrowserRouter>
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;