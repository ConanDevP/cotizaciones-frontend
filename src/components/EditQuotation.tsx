import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotation, updateQuotation } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProductData, CreateQuotationData } from '../types';

const initialProductState: CreateProductData = {
    vendor: '',
    quotationContact: '',
    freight: 0,
    annualQty: 0,
    uom: '',
    costEA: 0,
    currency: 'MXN',
    extPrecost: 0,
    margin: 0,
    priceEA: 0,
    extPriceSIMA: 0,
    extraMargin: 'NO',
    finalPriceEA: 0,
    extPriceMXN: 0,
    commentsLink: ''
};

export default function EditQuotation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateQuotationData>({
        title: '',
        quote_number: '',
        estado: 'VIGENTE',
        products: []
    });

    const [products, setProducts] = useState<CreateProductData[]>([initialProductState]);

    const { data: quotationData, isLoading } = useQuery({
        queryKey: ['quotation', id],
        queryFn: () => getQuotation(id as string),
        enabled: !!id
    });

    const updateQuotationMutation = useMutation({
        mutationFn: (data: CreateQuotationData) => updateQuotation(id as string, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            toast.success('Cotización actualizada exitosamente');
            navigate('/');
        },
        onError: () => {
            toast.error('Error al actualizar la cotización');
        }
    });

    useEffect(() => {
        if (quotationData?.data) {
            const { title, quote_number, estado, products } = quotationData.data;
            setFormData({ title, quote_number, estado });
            setProducts(products);
        }
    }, [quotationData]);

    const calculateProductTotals = (product: CreateProductData): CreateProductData => {
        const newProduct = { ...product };

        newProduct.extPrecost = newProduct.costEA * product.annualQty;

        if (product.annualQty > 0) {
            newProduct.priceEA = (newProduct.costEA / (1 - (product.margin / 100))) +
                (product.freight / product.annualQty);
        } else {
            newProduct.priceEA = 0;
        }

        newProduct.extPriceSIMA = newProduct.priceEA * product.annualQty;

        if (product.extraMargin === 'SI') {
            newProduct.finalPriceEA = newProduct.priceEA * 1.1;
        } else {
            newProduct.finalPriceEA = newProduct.priceEA;
        }

        newProduct.extPriceMXN = newProduct.finalPriceEA * product.annualQty;

        return newProduct;
    };

    const handleProductChange = (index: number, field: keyof CreateProductData, value: any) => {
        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            [field]: value
        };
        updatedProducts[index] = calculateProductTotals(updatedProducts[index]);
        setProducts(updatedProducts);
    };

    const addProductRow = () => {
        setProducts([...products, initialProductState]);
    };

    const removeProductRow = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const calculateTotals = (products: CreateProductData[]) => {
        return products.reduce((totals, product) => {
            return {
                margenTotal: totals.margenTotal + (product.extPriceSIMA - product.extPrecost),
                totalPriceEA: totals.totalPriceEA + (product.extPriceMXN - product.extPrecost),
                extPriceSIMA: totals.extPriceSIMA + (product.extPriceMXN * 0.1),
                extraMargin: totals.extraMargin + ((product.extPrecost / product.extPriceSIMA) * 100),
                finalPriceEA: totals.finalPriceEA + (product.priceEA / (1 / (product.extraMargin === 'SI' ? 1.1 : 1))),
            };
        }, {
            margenTotal: 0,
            totalPriceEA: 0,
            extPriceSIMA: 0,
            extraMargin: 0,
            finalPriceEA: 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const quotationData = {
                title: formData.title,
                quote_number: formData.quote_number,
                estado: formData.estado,
                products: products.map(product => ({
                    vendor: product.vendor,
                    quotationContact: product.quotationContact,
                    freight: Number(product.freight),
                    annualQty: Number(product.annualQty),
                    uom: product.uom,
                    costEA: Number(product.costEA),
                    currency: product.currency,
                    extPrecost: Number(product.extPrecost),
                    margin: Number(product.margin),
                    priceEA: Number(product.priceEA),
                    extPriceSIMA: Number(product.extPriceSIMA),
                    finalPriceEA: Number(product.finalPriceEA),
                    extPriceMXN: Number(product.extPriceMXN),
                    commentsLink: product.commentsLink,
                    extraMargin: product.extraMargin
                }))
            };

            await updateQuotationMutation.mutateAsync(quotationData);
        } catch (error) {
            console.error('Error al actualizar la cotización:', error);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Editar Cotización</h1>

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quote_number">Número de Cotización</Label>
                            <Input
                                id="quote_number"
                                value={formData.quote_number}
                                onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Productos</h2>
                            <Button type="button" variant="outline" onClick={addProductRow}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Producto
                            </Button>
                        </div>

                        {products.map((product, index) => (
                            <Card key={index} className="p-4 space-y-6">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Vendedor</Label>
                                        <Input
                                            value={product.vendor}
                                            onChange={(e) => handleProductChange(index, 'vendor', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contacto</Label>
                                        <Input
                                            value={product.quotationContact}
                                            onChange={(e) => handleProductChange(index, 'quotationContact', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>UOM</Label>
                                        <Input
                                            value={product.uom}
                                            onChange={(e) => handleProductChange(index, 'uom', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cantidad Anual</Label>
                                        <Input
                                            type="number"
                                            value={product.annualQty}
                                            onChange={(e) => handleProductChange(index, 'annualQty', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Flete</Label>
                                        <Input
                                            type="number"
                                            value={product.freight}
                                            onChange={(e) => handleProductChange(index, 'freight', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Moneda</Label>
                                        <Select
                                            value={product.currency}
                                            onValueChange={(value) => handleProductChange(index, 'currency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar moneda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MXN">MXN</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Costo EA</Label>
                                        <Input
                                            type="number"
                                            value={product.costEA}
                                            onChange={(e) => handleProductChange(index, 'costEA', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ext Precost</Label>
                                        <Input
                                            type="number"
                                            value={product.extPrecost}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Margen (%)</Label>
                                        <Input
                                            type="number"
                                            value={product.margin}
                                            onChange={(e) => handleProductChange(index, 'margin', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Price EA</Label>
                                        <Input
                                            type="number"
                                            value={product.priceEA}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ext Price SIMA</Label>
                                        <Input
                                            type="number"
                                            value={product.extPriceSIMA}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Margen Extra</Label>
                                        <Select
                                            value={product.extraMargin}
                                            onValueChange={(value) => handleProductChange(index, 'extraMargin', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SI">SI</SelectItem>
                                                <SelectItem value="NO">NO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Final Price EA</Label>
                                        <Input
                                            type="number"
                                            value={product.finalPriceEA}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ext Price MXN</Label>
                                        <Input
                                            type="number"
                                            value={product.extPriceMXN}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Comentarios</Label>
                                    <Textarea
                                        value={product.commentsLink}
                                        onChange={(e) => handleProductChange(index, 'commentsLink', e.target.value)}
                                    />
                                </div>

                                {products.length > 1 && (
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => removeProductRow(index)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar Producto
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Resumen de Ganancias */}
                    <div className="mt-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Resumen de Ganancias</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Margen Total</Label>
                                        <div className="text-2xl font-bold">
                                            ${calculateTotals(products).margenTotal.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Suma de (SIMA - Precosto)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Total Price EA</Label>
                                        <div className="text-2xl font-bold">
                                            ${calculateTotals(products).totalPriceEA.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Suma de (MXN - Precosto)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">EXT PRICE SIMA</Label>
                                        <div className="text-2xl font-bold">
                                            ${calculateTotals(products).extPriceSIMA.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Suma de (MXN × 0.1)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Extra Margin</Label>
                                        <div className="text-2xl font-bold">
                                            {calculateTotals(products).extraMargin.toFixed(2)}%
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Promedio de (Precosto/SIMA)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Final Price EA</Label>
                                        <div className="text-2xl font-bold">
                                            ${calculateTotals(products).finalPriceEA.toFixed(2)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Suma de PriceEA ajustado
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="flex justify-end space-x-4 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/')}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateQuotationMutation.isPending}
                            >
                                {updateQuotationMutation.isPending ? 'Actualizando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}