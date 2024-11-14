import { Link, useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function BarraNavegacion() {
  const navigate = useNavigate();
  const cerrarSesion = useAuthStore((state) => state.logout);

  const manejarCierreSesion = () => {
    cerrarSesion();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">Sistema de Cotizaciones</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Cotización
              </Button>
            </Link>
            <Button variant="outline" onClick={manejarCierreSesion}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}