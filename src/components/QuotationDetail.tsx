import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotation } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
    Loader2,
    ArrowLeft,
    Calendar,
    Hash,
    FileText,
    Download,
    Eye
} from 'lucide-react';

const estadoColors = {
    VIGENTE: 'bg-green-500 text-white',
    COMPRADA: 'bg-yellow-500 text-white',
    CANCELADA: 'bg-red-500 text-white',
};

const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
});

const numberFormatter = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export default function QuotationDetail() {
    const { id } = useParams<{ documentId: string }>();
    const navigate = useNavigate();
console.log(id)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['quotation', id],
        queryFn: () => getQuotation(id || '')
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError || !data?.data) {
        return (
            <div className="text-center py-8 text-red-500">
                Error al cargar la cotización. Por favor, intenta de nuevo.
            </div>
        );
    }

    const quotation = Array.isArray(data.data) ? data.data[0] : data.data;
    console.log(quotation)

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Fecha no disponible';
        try {
            return format(new Date(dateString), 'PPP', { locale: es });
        } catch {
            return 'Fecha no disponible';
        }
    };

    // Funciones de cálculo de totales
    const calculateTotals = () => {
        return quotation.products.reduce((totals, product) => ({
            quantity: totals.quantity + product.annualQty,
            costEA: totals.costEA + product.costEA,
            priceEA: totals.priceEA + product.priceEA,
            margin: totals.margin + product.margin,
            totalMXN: totals.totalMXN + product.extPriceMXN
        }), {
            quantity: 0,
            costEA: 0,
            priceEA: 0,
            margin: 0,
            totalMXN: 0
        });
    };

    const getAverages = () => {
        const productCount = quotation.products.length;
        const totals = calculateTotals();
        return {
            avgCostEA: totals.costEA / productCount,
            avgPriceEA: totals.priceEA / productCount,
            avgMargin: totals.margin / productCount
        };
    };

    // Función para exportar a Excel
    const exportToExcel = () => {
        const averages = getAverages();

        // Preparar los datos para el Excel
        const excelData = quotation.products.map((product, index) => ({
            'Item': index + 1,
            'Proveedor': product.vendor,
            'Contacto': product.quotationContact,
            'Cantidad': product.annualQty,
            'UOM': product.uom,
            'Costo EA': product.costEA,
            'Price EA': product.priceEA,
            'Margen (%)': product.margin,
            'Margen Extra': product.extraMargin,
            'Total MXN': product.extPriceMXN
        }));

        // Agregar fila de totales
        excelData.push({
            'Item': 'TOTALES',
            'Proveedor': '',
            'Contacto': '',
            'Cantidad': calculateTotals().quantity,
            'UOM': '',
            'Costo EA': averages.avgCostEA,
            'Price EA': averages.avgPriceEA,
            'Margen (%)': averages.avgMargin,
            'Margen Extra': '',
            'Total MXN': calculateTotals().totalMXN
        });

        // Crear el libro de Excel
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cotización');

        // Descargar el archivo
        XLSX.writeFile(wb, `Cotización_${quotation.quote_number}.xlsx`);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-bold">Detalles de Cotización</h1>
                </div>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Información General
                        </h2>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Número de Cotización</p>
                                    <p className="text-lg font-medium flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        {quotation.quote_number}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Estado</p>
                                    <Badge
                                        variant="secondary"
                                        className={estadoColors[quotation.estado as keyof typeof estadoColors]}
                                    >
                                        {quotation.estado}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Título</p>
                                <p className="text-lg font-medium">{quotation.title}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                                <p className="text-lg font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(quotation.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Resumen de Totales</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total Productos</p>
                                <p className="text-xl font-bold">{quotation.products.length}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Cantidad Total</p>
                                <p className="text-xl font-bold">{calculateTotals().quantity.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Promedio Costo EA</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(getAverages().avgCostEA)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Promedio Price EA</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(getAverages().avgPriceEA)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Margen Promedio</p>
                                <p className="text-xl font-bold">{numberFormatter.format(getAverages().avgMargin)}%</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total MXN</p>
                                <p className="text-xl font-bold text-green-600">
                                    {currencyFormatter.format(calculateTotals().totalMXN)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <div className="space-y-4">
                   

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center">Item</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead className="text-right">Costo EA</TableHead>
                                    <TableHead className="text-right">Price EA</TableHead>
                                    <TableHead className="text-right">Margen</TableHead>
                                    <TableHead className="text-right">Total MXN</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotation.products.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                        <TableCell>{product.vendor}</TableCell>
                                        <TableCell>{product.quotationContact}</TableCell>
                                        <TableCell className="text-right">{product.annualQty.toLocaleString()}</TableCell>
                                        <TableCell>{product.uom}</TableCell>
                                        <TableCell className="text-right">{currencyFormatter.format(product.costEA)}</TableCell>
                                        <TableCell className="text-right">{currencyFormatter.format(product.priceEA)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={product.extraMargin === 'SI' ? 'default' : 'secondary'}>
                                                {product.margin}% {product.extraMargin === 'SI' && '+ Extra'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {currencyFormatter.format(product.extPriceMXN)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={3}>TOTALES</TableCell>
                                    <TableCell className="text-right">{calculateTotals().quantity.toLocaleString()}</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(getAverages().avgCostEA)}</TableCell>
                                    <TableCell className="text-right">{currencyFormatter.format(getAverages().avgPriceEA)}</TableCell>
                                    <TableCell className="text-right">{numberFormatter.format(getAverages().avgMargin)}%</TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {currencyFormatter.format(calculateTotals().totalMXN)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Card>
        </div>
    );
}