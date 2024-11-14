import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function FormularioLogin() {
  const navigate = useNavigate();
  const iniciarSesion = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [credenciales, setCredenciales] = useState({
    usuario: '',
    contraseña: '',
  });

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exito = await iniciarSesion(
        credenciales.usuario,
        credenciales.contraseña
      );

      if (exito) {
        toast.success('Inicio de sesión exitoso');
        navigate('/');
      } else {
        toast.error('Credenciales inválidas');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Bienvenido de nuevo</h1>
          <p className="text-muted-foreground">Por favor ingresa tus credenciales</p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Ingresa tu usuario"
              disabled={loading}
              value={credenciales.usuario}
              onChange={(e) =>
                setCredenciales((prev) => ({
                  ...prev,
                  usuario: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <Input
              id="contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              value={credenciales.contraseña}
              onChange={(e) =>
                setCredenciales((prev) => ({
                  ...prev,
                  contraseña: e.target.value,
                }))
              }
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </Card>
    </div>
  );
}