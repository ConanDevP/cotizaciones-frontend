import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotation, updateQuotation, createFieldComment, updateFieldComment, deleteFieldComment } from '@/services/api';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProductData, CreateQuotationData, FieldComment } from '../types';

interface FieldCommentsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fieldName: string;
    currentValue: string | number;
    comments: FieldComment[];
    onAddComment: (comment: string) => void;
    onEditComment: (commentId: number, newValue: string) => void;
    onDeleteComment: (commentId: number) => void;
}

// Componente de diálogo de comentarios mejorado
const FieldCommentsDialog = ({
    isOpen,
    onClose,
    fieldName,
    currentValue,
    comments,
    onAddComment,
    onEditComment,
    onDeleteComment,
}: FieldCommentsDialogProps) => {
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    // Función para manejar la eliminación
    const handleDelete = async (commentId: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            await onDeleteComment(commentId);
            // No necesitamos actualizar el estado local ya que los props se actualizarán
        }
    };

    // Función para manejar la edición
    const handleEdit = async (commentId: number, newValue: string) => {
        if (newValue.trim()) {
            await onEditComment(commentId, newValue);
            setEditingCommentId(null);
            setEditingValue('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Comentarios para {fieldName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded">
                        <Label>Valor actual</Label>
                        <div className="font-medium">{currentValue}</div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-3">
                        {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded-md border">
                                {editingCommentId === comment.id ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="min-h-[60px]"
                                        />
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingCommentId(null);
                                                    setEditingValue('');
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => handleEdit(comment.id!, editingValue)}
                                            >
                                                Guardar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm">{comment.value}</p>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                            <div className="space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingCommentId(comment.id!);
                                                        setEditingValue(comment.value);
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(comment.id!)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label>Nuevo comentario</Label>
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (newComment.trim()) {
                                        onAddComment(newComment);
                                        setNewComment('');
                                    }
                                }}
                                disabled={!newComment.trim()}
                            >
                                Agregar Comentario
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const initialProductState: CreateProductData = {
    name: '',
    vendor: '',
    quotationContact: '',
    freight: 0,
    annualQty: 0,
    uom: '',
    customUom: '',
    costEA: 0,
    currency: 'MXN',
    extPrecost: 0,
    margin: 0,
    priceEA: 0,
    extPriceSIMA: 0,
    extraMargin: 'NO',
    finalPriceEA: 0,
    extPriceMXN: 0,
    commentsLink: '',
    field_comments: []
};

export default function EditQuotation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Estados principales
    const [formData, setFormData] = useState<CreateQuotationData>({
        title: '',
        quote_number: '',
        estado: 'VIGENTE',
        products: []
    });

    const [products, setProducts] = useState<CreateProductData[]>([initialProductState]);

    const [commentDialog, setCommentDialog] = useState<{
        isOpen: boolean;
        fieldName: string;
        productIndex: number;
        currentValue: string | number;
        comments: FieldComment[];
    }>({
        isOpen: false,
        fieldName: '',
        productIndex: 0,
        currentValue: '',
        comments: []
    });

    // Consulta y mutación
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

    // Effect para cargar datos iniciales
    useEffect(() => {
        if (quotationData?.data) {
            const { title, quote_number, estado, products } = quotationData.data;
            setFormData({ title, quote_number, estado });
            setProducts(products.map(product => ({
                ...product,
                field_comments: product.field_comments || []
            })));
        }
    }, [quotationData]);

    // Funciones de cálculo y manejo de productos
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
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const updatedProduct = { ...updatedProducts[index] };

            // Actualizar el campo específico
            updatedProduct[field] = value;

            // Manejar la lógica específica para UOM
            if (field === 'uom') {
                if (value !== 'custom') {
                    updatedProduct.customUom = '';
                }
            }

            // Calcular totales
            const calculatedProduct = calculateProductTotals(updatedProduct);
            updatedProducts[index] = calculatedProduct;

            return updatedProducts;
        });
    };

    // Manejadores de comentarios
    const handleAddComment = (productIndex: number, fieldName: string, comment: string) => {
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const updatedProduct = { ...updatedProducts[productIndex] };

            if (!updatedProduct.field_comments) {
                updatedProduct.field_comments = [];
            }

            updatedProduct.field_comments = [
                ...updatedProduct.field_comments,
                {
                    id: Date.now(),
                    field_name: fieldName,
                    value: comment,
                    timestamp: new Date().toISOString(),
                    field_value: String(updatedProduct[fieldName as keyof CreateProductData])
                }
            ];

            updatedProducts[productIndex] = updatedProduct;
            return updatedProducts;
        });

        setCommentDialog(prev => ({ ...prev, isOpen: false }));
        toast.success('Comentario agregado correctamente');
    };

    const handleEditComment = (productIndex: number, commentId: number, newValue: string) => {
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const updatedProduct = { ...updatedProducts[productIndex] };

            if (updatedProduct.field_comments) {
                updatedProduct.field_comments = updatedProduct.field_comments.map(comment =>
                    comment.id === commentId
                        ? {
                            ...comment,
                            value: newValue,
                            timestamp: new Date().toISOString()
                        }
                        : comment
                );
            }

            updatedProducts[productIndex] = updatedProduct;
            return updatedProducts;
        });

        toast.success('Comentario actualizado correctamente');
    };

    const handleDeleteComment = (productIndex: number, commentId: number) => {
        setProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const updatedProduct = { ...updatedProducts[productIndex] };

            if (updatedProduct.field_comments) {
                updatedProduct.field_comments = updatedProduct.field_comments.filter(
                    comment => comment.id !== commentId
                );
            }

            updatedProducts[productIndex] = updatedProduct;
            return updatedProducts;
        });

        toast.success('Comentario eliminado correctamente');
    };

    const getCommentsForField = (product: CreateProductData, fieldName: string): FieldComment[] => {
        return product.field_comments?.filter(comment => comment.field_name === fieldName) || [];
    };

    // Funciones auxiliares
    const addProductRow = () => {
        setProducts(prev => [...prev, initialProductState]);
    };

    const removeProductRow = (index: number) => {
        setProducts(prev => prev.filter((_, i) => i !== index));
    };

    // Continúa desde la parte anterior...

    const renderFieldWithComments = (
        label: string,
        fieldName: keyof CreateProductData,
        index: number,
        children: React.ReactNode,
        canHaveComments: boolean = false
    ) => {
        const product = products[index];
        const comments = canHaveComments ? getCommentsForField(product, fieldName) : [];
        const hasComments = comments.length > 0;

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>{label}</Label>
                    {canHaveComments && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`${hasComments ? "text-blue-600" : "text-gray-500"} hover:bg-gray-100`}
                            onClick={() => setCommentDialog({
                                isOpen: true,
                                fieldName: String(fieldName),
                                productIndex: index,
                                currentValue: product[fieldName],
                                comments
                            })}
                        >
                            <MessageSquare className={`h-4 w-4 ${hasComments ? "fill-current" : ""}`} />
                            {hasComments && <span className="ml-1 text-xs">{comments.length}</span>}
                        </Button>
                    )}
                </div>
                {children}
            </div>
        );
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
                    id: product.documentId,
                    name: product.name,
                    vendor: product.vendor,
                    quotationContact: product.quotationContact,
                    freight: Number(product.freight),
                    annualQty: Number(product.annualQty),
                    uom: product.uom === 'custom' ? product.customUom : product.uom,
                    customUom: product.customUom,
                    costEA: Number(product.costEA),
                    currency: product.currency,
                    extPrecost: Number(product.extPrecost),
                    margin: Number(product.margin),
                    priceEA: Number(product.priceEA),
                    extPriceSIMA: Number(product.extPriceSIMA),
                    finalPriceEA: Number(product.finalPriceEA),
                    extPriceMXN: Number(product.extPriceMXN),
                    commentsLink: product.commentsLink,
                    extraMargin: product.extraMargin,
                    field_comments: product.field_comments?.map(comment => ({
                        id: comment.id,
                        field_name: comment.field_name,
                        value: comment.value,
                        field_value: comment.field_value,
                        timestamp: comment.timestamp
                    }))
                }))
            };

            await updateQuotationMutation.mutateAsync(quotationData);
        } catch (error) {
            console.error('Error al actualizar la cotización:', error);
            toast.error('Error al actualizar la cotización');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Edit Quote</h1>

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quote_number">Quote</Label>
                            <Input
                                id="quote_number"
                                value={formData.quote_number}
                                onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Products</h2>
                            <Button type="button" variant="outline" onClick={addProductRow}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </div>
                        {/* Continuación del renderizado de productos */}
                        {products.map((product, index) => (
                            <Card key={index} className="p-4 space-y-6">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={product.name}
                                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* First Row */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {renderFieldWithComments("Vendor", "vendor", index,
                                        <Input
                                            value={product.vendor}
                                            onChange={(e) => handleProductChange(index, 'vendor', e.target.value)}
                                            required
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Quotation/Contact", "quotationContact", index,
                                        <Input
                                            value={product.quotationContact}
                                            onChange={(e) => handleProductChange(index, 'quotationContact', e.target.value)}
                                            required
                                        />,
                                        true
                                    )}
                                    <div className="space-y-2">
                                        <Label>UOM</Label>
                                        <div className="space-y-2">
                                            <Select
                                                value={product.uom}
                                                onValueChange={(value) => {
                                                    handleProductChange(index, 'uom', value);
                                                    if (value !== 'custom') {
                                                        handleProductChange(index, 'customUom', '');
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select UOM" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pieza">Pieza</SelectItem>
                                                    <SelectItem value="paquete">Paquete</SelectItem>
                                                    <SelectItem value="metro">Metro</SelectItem>
                                                    <SelectItem value="litro">Litro</SelectItem>
                                                    <SelectItem value="custom">Entrada libre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {product.uom === 'custom' && (
                                                <Input
                                                    placeholder="Especifique UOM"
                                                    value={product.customUom || ''}
                                                    onChange={(e) => handleProductChange(index, 'customUom', e.target.value)}
                                                    className="mt-2"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Second Row */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Annual Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={product.annualQty}
                                            onChange={(e) => handleProductChange(index, 'annualQty', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    {renderFieldWithComments("Freight", "freight", index,
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={product.freight}
                                            onChange={(e) => handleProductChange(index, 'freight', parseFloat(e.target.value))}
                                            required
                                        />,
                                        true
                                    )}
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select
                                            value={product.currency}
                                            onValueChange={(value) => handleProductChange(index, 'currency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MXN">MXN</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Third Row - Costs */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {renderFieldWithComments("Cost EA", "costEA", index,
                                        <Input
                                            type="number"
                                            value={product.costEA}
                                            onChange={(e) => handleProductChange(index, 'costEA', parseFloat(e.target.value))}
                                            required
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Ext Precost", "extPrecost", index,
                                        <Input
                                            type="number"
                                            value={product.extPrecost}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    <div className="space-y-2">
                                        <Label>Margin (%)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={product.margin}
                                            onChange={(e) => handleProductChange(index, 'margin', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Fourth Row - Prices */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {renderFieldWithComments("Price EA", "priceEA", index,
                                        <Input
                                            type="number"
                                            value={product.priceEA}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Ext Price SIMA", "extPriceSIMA", index,
                                        <Input
                                            type="number"
                                            value={product.extPriceSIMA}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Extra Margin", "extraMargin", index,
                                        <Select
                                            value={product.extraMargin}
                                            onValueChange={(value) => handleProductChange(index, 'extraMargin', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SI">SI</SelectItem>
                                                <SelectItem value="NO">NO</SelectItem>
                                            </SelectContent>
                                        </Select>,
                                        true
                                    )}
                                </div>

                                {/* Fifth Row - Final Prices */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {renderFieldWithComments("Final Price EA", "finalPriceEA", index,
                                        <Input
                                            type="number"
                                            value={product.finalPriceEA}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Ext Price MXN", "extPriceMXN", index,
                                        <Input
                                            type="number"
                                            value={product.extPriceMXN}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-2">
                                    <Label>Comments/link</Label>
                                    <Textarea
                                        value={product.commentsLink}
                                        onChange={(e) => handleProductChange(index, 'commentsLink', e.target.value)}
                                    />
                                </div>

                                {/* Remove Product Button */}
                                {products.length > 1 && (
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => removeProductRow(index)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove Product
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                        </div>
                        {/* Resumen de Ganancias */}
                        <div className="mt-6">
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Profit Summary</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Total Margin</Label>
                                            <div className="text-2xl font-bold">
                                                ${calculateTotals(products).margenTotal.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Total Price EA</Label>
                                            <div className="text-2xl font-bold">
                                                ${calculateTotals(products).totalPriceEA.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">EXT PRICE SIMA</Label>
                                            <div className="text-2xl font-bold">
                                                ${calculateTotals(products).extPriceSIMA.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Extra Margin</Label>
                                            <div className="text-2xl font-bold">
                                                {calculateTotals(products).extraMargin.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-muted-foreground">Final Price EA</Label>
                                            <div className="text-2xl font-bold">
                                                ${calculateTotals(products).finalPriceEA.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateQuotationMutation.isPending}
                                >
                                    {updateQuotationMutation.isPending ? 'Updating...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                </Card>
            </form>

            {/* Comments Dialog */}
            <FieldCommentsDialog
                isOpen={commentDialog.isOpen}
                onClose={() => setCommentDialog(prev => ({ ...prev, isOpen: false }))}
                fieldName={commentDialog.fieldName}
                currentValue={commentDialog.currentValue}
                comments={commentDialog.comments}
                onAddComment={(comment) => handleAddComment(commentDialog.productIndex, commentDialog.fieldName, comment)}
                onEditComment={(commentId, newValue) => handleEditComment(commentDialog.productIndex, commentId, newValue)}
                onDeleteComment={(commentId) => handleDeleteComment(commentDialog.productIndex, commentId)}
            />
        </div>
    );
}


