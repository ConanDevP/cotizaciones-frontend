import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotations, updateQuotationStatus } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/AuthProvider';
import {
  CalendarDays,
  Hash,
  FileText,
  DollarSign,
  Eye,
  Download,
  Search,
  FilterX,
  Edit,
  RefreshCcw,
  MoreHorizontal,
  Cog,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

interface FilterParams {
  search: string;
  startDate: Date | null;
}

interface StatusDialogState {
  isOpen: boolean;
  quotationId: string | null;
  currentStatus: string;
}

const estadoColors = {
  VIGENTE: 'bg-green-500 text-white',
  COMPRADA: 'bg-blue-500 text-white',
  CANCELADA: 'bg-red-500 text-white',
};

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export default function QuotationList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  console.log(" rol ",userRole)
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    startDate: null,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    isOpen: false,
    quotationId: null,
    currentStatus: '',
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quotations', page],
    queryFn: () => getQuotations(page, pageSize),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateQuotationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Estado actualizado exitosamente');
      setStatusDialog({ isOpen: false, quotationId: null, currentStatus: '' });
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const calculateTotal = (products: any[]) => {
    if (!products || !Array.isArray(products)) return 0;
    return products.reduce((sum, product) => sum + (product.extPriceMXN || 0), 0);
  };

  const filteredQuotations = useMemo(() => {
    if (!data?.data) return [];
    let filtered = data.data;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((quotation) =>
        quotation.title.toLowerCase().includes(searchLower) ||
        quotation.quote_number.toLowerCase().includes(searchLower) ||
        quotation.estado.toLowerCase().includes(searchLower) ||
        quotation.products.some((product) =>
          product.vendor.toLowerCase().includes(searchLower) ||
          product.quotationContact.toLowerCase().includes(searchLower)
        )
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter((quotation) => {
        const quotationDate = new Date(quotation.createdAt);
        return quotationDate >= startOfDay(filters.startDate) && quotationDate <= endOfDay(filters.startDate);
      });
    }

    return filtered;
  }, [data?.data, filters]);

  const handleExportExcel = () => {
    if (!filteredQuotations.length) return;

    const exportData = filteredQuotations.map((quotation) => ({
      Fecha: formatDate(quotation.createdAt),
      'Número': quotation.quote_number,
      'Título': quotation.title,
      Estado: quotation.estado,
      'Total MXN': calculateTotal(quotation.products),
      'Cantidad de Productos': quotation.products.length,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');
    XLSX.writeFile(wb, `Cotizaciones_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      startDate: null,
    });
  };

  const handleStatusChange = (status: string) => {
    if (statusDialog.quotationId) {
      updateStatusMutation.mutate({
        id: statusDialog.quotationId,
        status,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!filteredQuotations.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          {userRole === 'admin' && (
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Cog className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, número, estado..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="pl-8"
            />
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" />
              Fecha de Cotización
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              initialFocus
              mode="single"
              defaultMonth={filters.startDate ?? undefined}
              selected={filters.startDate ?? undefined}
              onSelect={(date) => {
                setFilters((prev) => ({
                  ...prev,
                  startDate: date ?? null,
                }));
              }}
              numberOfMonths={1}
              className="rounded-md border bg-white text-foreground"
            />
          </PopoverContent>
        </Popover>

        {(filters.search || filters.startDate) && (
          <Button variant="ghost" onClick={resetFilters} className="h-10">
            <FilterX className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {filters.search || filters.startDate
                    ? 'No se encontraron cotizaciones con los filtros aplicados'
                    : 'No hay cotizaciones. ¡Crea la primera!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id} className="hover:bg-muted/50">
                  <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                  <TableCell>{quotation.quote_number}</TableCell>
                  <TableCell className="font-medium">
                    <div className="max-w-[200px] truncate" title={quotation.title}>
                      {quotation.title}
                    </div>
                  </TableCell>
                  <TableCell>{quotation.products[0]?.vendor || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {quotation.products.length} producto{quotation.products.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currencyFormatter.format(calculateTotal(quotation.products))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={estadoColors[quotation.estado as keyof typeof estadoColors]}
                    >
                      {quotation.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <MoreHorizontal className="h-4 w-4 text-black" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/quotation/${quotation.documentId}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/edit/${quotation.documentId}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setStatusDialog({
                              isOpen: true,
                              quotationId: quotation.documentId,
                              currentStatus: quotation.estado,
                            })
                          }
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Cambiar estado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredQuotations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
              <p className="text-2xl font-bold">{filteredQuotations.length}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total en MXN</p>
              <p className="text-2xl font-bold">
                {currencyFormatter.format(
                  filteredQuotations.reduce((sum, quotation) =>
                    sum + calculateTotal(quotation.products), 0
                  )
                )}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cotizaciones Vigentes</p>
              <p className="text-2xl font-bold">
                {filteredQuotations.filter(q => q.estado === 'VIGENTE').length}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-bold">
                {filteredQuotations.reduce((sum, quotation) =>
                  sum + quotation.products.length, 0
                )}
              </p>
            </div>
          </Card>
        </div>
      )}

      {filteredQuotations.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={data?.meta?.pagination?.pageCount || 1}
          onPageChange={(newPage) => setPage(newPage)}
          className="mt-4"
        />
      )}

      <Dialog
        open={statusDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog({
              isOpen: false,
              quotationId: null,
              currentStatus: '',
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Cotización</DialogTitle>
            <DialogDescription>Selecciona el nuevo estado para esta cotización</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={statusDialog.currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIGENTE">VIGENTE</SelectItem>
                <SelectItem value="COMPRADA">COMPRADA</SelectItem>
                <SelectItem value="CANCELADA">CANCELADA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setStatusDialog({
                  isOpen: false,
                  quotationId: null,
                  currentStatus: '',
                })
              }
            >
              Cancelar
            </Button>
            <Button
              disabled={updateStatusMutation.isPending}
              onClick={() => handleStatusChange(statusDialog.currentStatus)}
            >
              {updateStatusMutation.isPending ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
