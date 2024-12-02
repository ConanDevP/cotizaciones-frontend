import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface User {
    id: number;
    username: string;
    email: string;
}

interface CreateUserData {
    username: string;
    email: string;
    password: string;
}

const STRAPI_URL = 'https://sistema-cotizaciones-production.up.railway.app/api';

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const [isOpen, setIsOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${STRAPI_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            return response.json();
        }
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: CreateUserData) => {
            const response = await fetch(`${STRAPI_URL}/auth/local/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Error al crear usuario');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario creado exitosamente');
            setIsOpen(false);
            setNewUser({ username: '', email: '', password: '' });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el usuario');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(newUser);
    };

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Configuración</h1>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                    <Button onClick={() => setIsOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuevo Usuario
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user: User) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                        <Lock className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuario</Label>
                            <Input
                                id="username"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createUserMutation.isPending}>
                                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}