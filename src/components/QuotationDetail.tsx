import { useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    Eye,
    MessageSquare,
    DollarSign,
    Calculator,
    Percent,
    Tags,
    Clock,
    History
} from 'lucide-react';

interface Comment {
    id: number;
    field_name: string;
    value: string;
    field_value: string;
    timestamp: string;
}

interface Product {
    id: number;
    vendor: string;
    quotationContact: string;
    freight: number;
    annualQty: number;
    uom: string;
    costEA: number;
    currency: string;
    extPrecost: number;
    margin: number;
    priceEA: number;
    extPriceSIMA: number;
    extraMargin: string;
    finalPriceEA: number;
    extPriceMXN: number;
    commentsLink: string;
    field_comments?: Comment[];
}

interface Quotation {
    id: number;
    title: string;
    quote_number: string;
    estado: string;
    createdAt: string;
    updatedAt: string;
    products: Product[];
}

interface FieldCommentsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    comments: Comment[];
    fieldName: string;
    currentValue: string | number;
}

const FieldCommentsDialog = ({
    isOpen,
    onClose,
    comments,
    fieldName,
    currentValue
}: FieldCommentsDialogProps) => {
    const getFieldLabel = (name: string) => {
        const labels: { [key: string]: string } = {
            vendor: 'Vendor',
            quotationContact: 'Contact',
            freight: 'Freight',
            costEA: 'Cost EA',
            extPrecost: 'Ext Precost',
            priceEA: 'Price EA',
            extPriceSIMA: 'Ext Price SIMA',
            finalPriceEA: 'Final Price EA',
            extPriceMXN: 'Ext Price MXN',
            extraMargin: 'Extra Margin',
            margin: 'Margin',
            currency: 'Currency'
        };
        return labels[name] || name;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments for {getFieldLabel(fieldName)}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Current value</p>
                        <p className="text-lg font-medium">{currentValue}</p>
                    </div>
                    {comments.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {comments.map((comment, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                                    <p className="text-sm mb-2">{comment.value}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(comment.timestamp), 'PPP p', { locale: es })}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <History className="h-4 w-4" />
                                            Previous value: {comment.field_value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No comments for this field</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const statusColors = {
    VIGENTE: 'bg-green-500 text-white',
    COMPRADA: 'bg-yellow-500 text-white',
    CANCELADA: 'bg-red-500 text-white',
};

const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export default function QuotationDetail() {
    const { id } = useParams<{ documentId: string }>();
    const navigate = useNavigate();

    const [commentDialog, setCommentDialog] = useState<{
        isOpen: boolean;
        fieldName: string;
        comments: Comment[];
        currentValue: string | number;
    }>({
        isOpen: false,
        fieldName: '',
        comments: [],
        currentValue: ''
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['quotation', id],
        queryFn: () => getQuotation(id || '')
    });

    const handleShowComments = (fieldName: string, comments: Comment[], currentValue: string | number) => {
        setCommentDialog({
            isOpen: true,
            fieldName,
            comments: comments || [],
            currentValue
        });
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Date not available';
        try {
            return format(new Date(dateString), 'PPP', { locale: es });
        } catch {
            return 'Date not available';
        }
    };

    const calculateTotals = (products: Product[]) => {
        return products.reduce((totals, product) => ({
            quantity: totals.quantity + product.annualQty,
            freight: totals.freight + product.freight,
            costEA: totals.costEA + product.costEA,
            extPrecost: totals.extPrecost + product.extPrecost,
            priceEA: totals.priceEA + product.priceEA,
            extPriceSIMA: totals.extPriceSIMA + product.extPriceSIMA,
            finalPriceEA: totals.finalPriceEA + product.finalPriceEA,
            margin: totals.margin + product.margin,
            totalMXN: totals.totalMXN + product.extPriceMXN
        }), {
            quantity: 0,
            freight: 0,
            costEA: 0,
            extPrecost: 0,
            priceEA: 0,
            extPriceSIMA: 0,
            finalPriceEA: 0,
            margin: 0,
            totalMXN: 0
        });
    };

    const getAverages = (products: Product[]) => {
        const productCount = products.length;
        const totals = calculateTotals(products);
        return {
            avgFreight: totals.freight / productCount,
            avgCostEA: totals.costEA / productCount,
            avgPriceEA: totals.priceEA / productCount,
            avgFinalPriceEA: totals.finalPriceEA / productCount,
            avgMargin: totals.margin / productCount,
            avgExtPrecost: totals.extPrecost / productCount,
            avgExtPriceSIMA: totals.extPriceSIMA / productCount
        };
    };

    const getCommentsForField = (product: Product, fieldName: string): Comment[] => {
        return product.field_comments?.filter(
            comment => comment.field_name === fieldName
        ) || [];
    };

    const renderCellWithComments = (
        value: string | number,
        product: Product,
        fieldName: string,
        formatter: (value: any) => string = String
    ) => {
        const comments = getCommentsForField(product, fieldName);
        const hasComments = comments.length > 0;

        return (
            <div className="flex items-center justify-end gap-2">
                <span>{formatter(value)}</span>
                {hasComments && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-6 ${hasComments ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400'}`}
                        onClick={() => handleShowComments(fieldName, comments, formatter(value))}
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span className="ml-1 text-xs">{comments.length}</span>
                    </Button>
                )}
            </div>
        );
    };

    const exportToExcel = (quotation: Quotation) => {
        const products = quotation.products;
        const totals = calculateTotals(products);
        const averages = getAverages(products);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Prepare headers with styles
        const headers = [
            'Item',
            'Name',
            'Vendor',
            'Quotation/Contact',
            'Contacto',
            'Cantidad',
            'UOM',
            'Flete',
            'Costo EA',
            'Currency',
            'Ext Precost',
            'Price EA',
            'Ext Price SIMA',
            'ExtraMargin',
            'Margen',
            'Final Price EA',
            'Ext Price MXN',
            'CommentsLink'
        ];

        // Format the products data to match table structure
        const productsData = products.map((product, index) => [
            index + 1,
            product.name || '',
            product.vendor,
            product.quotationContact,
            product.quotationContact,
            product.annualQty,
            product.uom != 'custom' ? product.uom : product.customUom,
            product.freight,
            product.costEA,
            product.currency,
            product.extPrecost,
            product.priceEA,
            product.extPriceSIMA,
            product.extraMargin,
            product.margin,
            product.finalPriceEA,
            product.extPriceMXN,
            product.commentsLink || 'N/A'
        ]);

        // Add totals row
        const totalsRow = [
            'TOTALES',
            '', // Name
            '', // Vendor
            '', // Quotation/Contact
            '', // Contacto
            totals.quantity,
            '', // UOM
            averages.avgFreight,
            averages.avgCostEA,
            '', // Currency
            totals.extPrecost,
            averages.avgPriceEA,
            totals.extPriceSIMA,
            '', // ExtraMargin
            averages.avgMargin,
            averages.avgFinalPriceEA,
            totals.totalMXN,
            '' // CommentsLink
        ];

        // Combine all rows
        const allData = [headers, ...productsData, totalsRow];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(allData);

        // Define column widths
        ws['!cols'] = [
            { wch: 6 },  // Item
            { wch: 20 }, // Name
            { wch: 20 }, // Vendor
            { wch: 20 }, // Quotation/Contact
            { wch: 20 }, // Contacto
            { wch: 12 }, // Cantidad
            { wch: 8 },  // UOM
            { wch: 12 }, // Flete
            { wch: 12 }, // Costo EA
            { wch: 10 }, // Currency
            { wch: 15 }, // Ext Precost
            { wch: 12 }, // Price EA
            { wch: 15 }, // Ext Price SIMA
            { wch: 12 }, // ExtraMargin
            { wch: 10 }, // Margen
            { wch: 15 }, // Final Price EA
            { wch: 15 }, // Ext Price MXN
            { wch: 20 }  // CommentsLink
        ];

        // Apply styles to the worksheet
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const totalRowIndex = range.e.r;

        // Style configuration
        const headerStyle = {
            fill: { fgColor: { rgb: "4F81BD" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" }
        };

        const totalRowStyle = {
            fill: { fgColor: { rgb: "E6E6E6" } },
            font: { bold: true },
            alignment: { horizontal: "right" }
        };

        const numberStyle = {
            alignment: { horizontal: "right" },
            numFmt: '"$"#,##0.00'
        };

        const percentStyle = {
            alignment: { horizontal: "right" },
            numFmt: '0.00"%"'
        };

        // Apply styles to cells
        for (let C = range.s.c; C <= range.e.c; C++) {
            // Headers
            const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
            ws[headerCell].s = headerStyle;

            // Total row
            const totalCell = XLSX.utils.encode_cell({ r: totalRowIndex, c: C });
            if (ws[totalCell]) {
                ws[totalCell].s = totalRowStyle;
            }

            // Apply number formatting to numeric columns
            for (let R = 1; R <= totalRowIndex; R++) {
                const cell = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cell]) {
                    // Currency columns
                    if ([7, 8, 10, 11, 12, 15, 16].includes(C)) {
                        ws[cell].s = numberStyle;
                    }
                    // Percentage columns
                    else if (C === 14) {
                        ws[cell].s = percentStyle;
                    }
                }
            }
        }

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Quotation Details');

        // Save the file
        const fileName = `Quotation_${quotation.quote_number}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

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
                Error loading quotation. Please try again.
            </div>
        );
    }
    const quotation = Array.isArray(data.data) ? data.data[0] : data.data;
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Quotation Details</h1>
                </div>
                <Button variant="outline" onClick={() => exportToExcel(quotation)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            General Information
                        </h2>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Quote</p>
                                    <p className="text-lg font-medium flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        {quotation.quote_number}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge
                                        variant="secondary"
                                        className={statusColors[quotation.estado as keyof typeof statusColors]}
                                    >
                                        {quotation.estado}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Client</p>
                                <p className="text-lg font-medium">{quotation.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Creation Date</p>
                                    <p className="text-lg font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(quotation.createdAt)}
                                    </p>
                                </div>
                            </div>
                            {quotation.edit && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Last Editor</p>
                                        <p className="text-lg font-medium flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            {quotation.users && quotation.users.length > 0
                                                ? quotation.users[quotation.users.length - 1]?.username
                                                : 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Last Edit</p>
                                        <p className="text-lg font-medium flex items-center gap-2">
                                            <History className="h-4 w-4" />
                                            {formatDate(quotation.date_edit)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Summary of Totals
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total Products</p>
                                <p className="text-xl font-bold">{quotation.products.length}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total Quantity</p>
                                <p className="text-xl font-bold">{calculateTotals(quotation.products).quantity.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Average Freight</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(getAverages(quotation.products).avgFreight)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Average EA Cost</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(getAverages(quotation.products).avgCostEA)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Average Margin</p>
                                <p className="text-xl font-bold">{numberFormatter.format(getAverages(quotation.products).avgMargin)}%</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Final Price EA Average</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(getAverages(quotation.products).avgFinalPriceEA)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Ext Price SIMA Total</p>
                                <p className="text-xl font-bold">{currencyFormatter.format(calculateTotals(quotation.products).extPriceSIMA)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total MXN</p>
                                <p className="text-xl font-bold text-green-600">
                                    {currencyFormatter.format(calculateTotals(quotation.products).totalMXN)}
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
                                    <TableHead className="w-[50px] text-center">Item</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Quotation/Contact</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead className="text-right">Annual Qty</TableHead>
                                    <TableHead>UOM</TableHead>
                                    <TableHead className="text-right">Freight</TableHead>
                                    <TableHead className="text-right">Cost EA</TableHead>
                                    <TableHead className="text-right">Currency</TableHead>
                                    <TableHead className="text-right">Ext Precost</TableHead>
                                    <TableHead className="text-right">Price EA</TableHead>
                                    <TableHead className="text-right">Ext Price SIMA</TableHead>
                                    <TableHead className="text-right">ExtraMargin</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                    <TableHead className="text-right">Final Price EA</TableHead>
                                    <TableHead className="text-right">Ext Price MXN</TableHead>
                                    <TableHead className="text-right">commentsLink</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotation.products.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            {renderCellWithComments(product.name, product, 'name')}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(product.vendor, product, 'vendor')}
                                        </TableCell>
                                        <TableCell>
                                            {product.quotationContact}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(product.quotationContact, product, 'quotationContact')}
                                        </TableCell>
                                        <TableCell className="text-right">{product.annualQty.toLocaleString()}</TableCell>
                                        <TableCell>{product.uom != 'custom' ? product.uom : product.customUom}</TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.freight,
                                                product,
                                                'freight',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.costEA,
                                                product,
                                                'costEA',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {product.currency}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.extPrecost,
                                                product,
                                                'extPrecost',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.priceEA,
                                                product,
                                                'priceEA',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.extPriceSIMA,
                                                product,
                                                'extPriceSIMA',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {product.extraMargin}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                `${product.margin}% ${product.extraMargin === 'SI' ? '(+Extra)' : ''}`,
                                                product,
                                                'margin'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {renderCellWithComments(
                                                product.finalPriceEA,
                                                product,
                                                'finalPriceEA',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {renderCellWithComments(
                                                product.extPriceMXN,
                                                product,
                                                'extPriceMXN',
                                                currencyFormatter.format
                                            )}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {product.commentsLink || "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={3}>TOTALS</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">
                                        {calculateTotals(quotation.products).quantity.toLocaleString()}
                                    </TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(getAverages(quotation.products).avgFreight)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(getAverages(quotation.products).avgCostEA)}
                                    </TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(calculateTotals(quotation.products).extPrecost)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(getAverages(quotation.products).avgPriceEA)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(calculateTotals(quotation.products).extPriceSIMA)}
                                    </TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right">
                                        {numberFormatter.format(getAverages(quotation.products).avgMargin)}%
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {currencyFormatter.format(getAverages(quotation.products).avgFinalPriceEA)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {currencyFormatter.format(calculateTotals(quotation.products).totalMXN)}
                                    </TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Card>

            <FieldCommentsDialog
                isOpen={commentDialog.isOpen}
                onClose={() => setCommentDialog(prev => ({ ...prev, isOpen: false }))}
                comments={commentDialog.comments}
                fieldName={commentDialog.fieldName}
                currentValue={commentDialog.currentValue}
            />
        </div>
    );
}