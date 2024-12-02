import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateQuotation } from '../hooks/useQuotations';
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
import { Trash2, Plus, MessageSquare, Pencil } from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface FieldComment {
    id?: number;
    field_name: string;
    value: string;
    timestamp: string;
    field_value: string;
    product_id?: number;
}

interface CreateProductData {
    id?: number;
    name: string;
    vendor: string;
    quotationContact: string;
    freight: number;
    annualQty: number;
    customUom?: string;
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
    field_comments?: FieldComment[];
}

interface CreateQuotationData {
    title: string;
    quote_number: string;
    estado: string;
    products: CreateProductData[];
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    fieldName: string;
    currentValue: string | number;
    comments: FieldComment[];
    onAddComment: (comment: string) => void;
    onEditComment: (commentId: number, newValue: string) => void;
    onDeleteComment: (commentId: number) => void;
}

// Componente Modal de Comentarios
const CommentModal = ({
    isOpen,
    onClose,
    fieldName,
    currentValue,
    comments,
    onAddComment,
    onEditComment,
    onDeleteComment,
}: CommentModalProps) => {
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<{
        id: number | null;
        value: string;
    }>({ id: null, value: '' });

    const getFieldLabel = (name: string) => {
        const labels: { [key: string]: string } = {
            vendor: 'Vendedor',
            quotationContact: 'Contacto',
            freight: 'Flete',
            costEA: 'Costo EA',
            extPrecost: 'Ext Precost',
            priceEA: 'Price EA',
            extPriceSIMA: 'Ext Price SIMA',
            finalPriceEA: 'Final Price EA',
            extPriceMXN: 'Ext Price MXN',
            extraMargin: 'Margen Extra'
        };
        return labels[name] || name;
    };

    const handleEdit = (comment: FieldComment) => {
        setEditingComment({ id: comment.id!, value: comment.value });
    };

    const handleSaveEdit = () => {
        if (editingComment.id && editingComment.value.trim()) {
            onEditComment(editingComment.id, editingComment.value);
            setEditingComment({ id: null, value: '' });
        }
    };

    const handleCancelEdit = () => {
        setEditingComment({ id: null, value: '' });
    };

    const handleDelete = (commentId: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            onDeleteComment(commentId);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Comentarios para {getFieldLabel(fieldName)}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded">
                        <Label>Valor actual</Label>
                        <div className="font-medium">{currentValue}</div>
                    </div>

                    {comments.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 p-3 rounded-md border">
                                    {editingComment.id === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editingComment.value}
                                                onChange={(e) => setEditingComment(prev => ({
                                                    ...prev,
                                                    value: e.target.value
                                                }))}
                                                className="min-h-[60px]"
                                                placeholder="Editar comentario..."
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleSaveEdit}
                                                    disabled={!editingComment.value.trim()}
                                                >
                                                    Guardar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm">{comment.value}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="text-xs text-gray-500">
                                                    Valor: {comment.field_value}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-700"
                                                        onClick={() => handleEdit(comment)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(comment.id!)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No hay comentarios para este campo
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label>Nuevo comentario</Label>
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
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
    vendor: '',
    name: '',
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
    commentsLink: '',
    field_comments: []
};

export default function QuotationForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CreateQuotationData>({
        title: '',
        quote_number: '',
        estado: 'VIGENTE',
        products: []
    });

    const createQuotationMutation = useCreateQuotation();
    const [products, setProducts] = useState<CreateProductData[]>([initialProductState]);

    const [commentModal, setCommentModal] = useState<{
        isOpen: boolean;
        fieldName: string;
        productIndex: number;
        currentValue: string | number;
    }>({
        isOpen: false,
        fieldName: '',
        productIndex: 0,
        currentValue: ''
    });

    // Lista de campos que pueden tener comentarios
    const commentableFields = [
        'vendor',
        'freight',
        'costEA',
        'extPrecost',
        'priceEA',
        'extPriceSIMA',
        'finalPriceEA',
        'extPriceMXN',
        'extraMargin'
    ];

    // Funciones de cálculo
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

    // notas editar eliminar
    const handleEditComment = (productIndex: number, fieldName: string, commentId: number, newValue: string) => {
        const updatedProducts = [...products];
        const product = updatedProducts[productIndex];

        if (product.field_comments) {
            const commentIndex = product.field_comments.findIndex(comment => comment.id === commentId);
            if (commentIndex !== -1) {
                product.field_comments[commentIndex] = {
                    ...product.field_comments[commentIndex],
                    value: newValue,
                    timestamp: new Date().toISOString()
                };
            }
        }

        setProducts(updatedProducts);
        toast.success('Comentario actualizado correctamente');
    };

    const handleDeleteComment = (productIndex: number, fieldName: string, commentId: number) => {
        const updatedProducts = [...products];
        const product = updatedProducts[productIndex];

        if (product.field_comments) {
            product.field_comments = product.field_comments.filter(
                comment => comment.id !== commentId
            );
        }

        setProducts(updatedProducts);
        toast.success('Comentario eliminado correctamente');
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

            // Calcular totales solo si es necesario
            const calculatedProduct = calculateProductTotals(updatedProduct);
            updatedProducts[index] = calculatedProduct;

            return updatedProducts;
        });
    };

    const addProductRow = () => {
        setProducts([...products, initialProductState]);
    };

    const removeProductRow = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    // Funciones de manejo de comentarios
    const handleAddComment = (productIndex: number, fieldName: string, comment: string) => {
        const updatedProducts = [...products];
        const product = updatedProducts[productIndex];

        if (!product.field_comments) {
            product.field_comments = [];
        }

        product.field_comments.push({
            field_name: fieldName,
            value: comment,
            timestamp: new Date().toISOString(),
            field_value: String(product[fieldName as keyof CreateProductData])
        });

        setProducts(updatedProducts);
        setCommentModal(prev => ({ ...prev, isOpen: false }));
        toast.success('Comentario agregado correctamente');
    };

    const getCommentsForField = (product: CreateProductData, fieldName: string): FieldComment[] => {
        return product.field_comments?.filter(comment => comment.field_name === fieldName) || [];
    };

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
                            onClick={() => setCommentModal({
                                isOpen: true,
                                fieldName: String(fieldName),
                                productIndex: index,
                                currentValue: product[fieldName]
                            })}
                        >
                            <MessageSquare className={`h-4 w-4 ${hasComments ? "fill-current" : ""}`} />
                            {hasComments && (
                                <span className="ml-1 text-xs">{comments.length}</span>
                            )}
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
                data: {
                    title: formData.title,
                    quote_number: formData.quote_number,
                    estado: 'VIGENTE',
                    products: products.map(product => {
                        const { field_comments, ...productData } = product;
                        return {
                            ...productData,
                            field_comments: field_comments?.map(comment => ({
                                field_name: comment.field_name,
                                value: comment.value,
                                timestamp: comment.timestamp,
                                field_value: comment.field_value
                            })),
                            publishedAt: new Date().toISOString()
                        };
                    })
                }
            };

            await createQuotationMutation.mutateAsync(quotationData);
            toast.success('Cotización creada exitosamente');
            navigate('/');
        } catch (error) {
            console.error('Error al crear la cotización:', error);
            toast.error('Error al crear la cotización');
        }
    };

    const renderUOMField = (index: number, product: CreateProductData) => (
        <div className="space-y-2">
            <Label>UOM</Label>
            <div className="space-y-2">
                <Select
                    value={product.uom}
                    onValueChange={(value) => handleProductChange(index, 'uom', value)}
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
    );


    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Nueva Cotización</h1>

            <form onSubmit={handleSubmit}>
                <Card className="p-6 space-y-6">
                    {/* Sección de información básica */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Client</Label>
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

                    {/* Sección de productos */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Products</h2>
                            <Button type="button" variant="outline" onClick={addProductRow}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add product
                            </Button>
                        </div>

                        {products.map((product, index) => (
                            <Card key={index} className="p-4 space-y-6">
                                {/* Primera fila de campos */}
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={product.name}
                                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {renderFieldWithComments("Vendor", "vendor", index,
                                        <Input
                                            value={product.vendor}
                                            onChange={(e) => handleProductChange(index, 'vendor', e.target.value)}
                                            required
                                        />,
                                        false
                                    )}
                                    {renderFieldWithComments("Quotation/Contact", "quotationContact", index,
                                        <Input
                                            value={product.quotationContact}
                                            onChange={(e) => handleProductChange(index, 'quotationContact', e.target.value)}
                                            required
                                        />,
                                        false
                                    )}
                                    {renderUOMField(index, product)}
                                </div>

                                {/* Segunda fila de campos */}
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

                                {/* Tercera fila de campos */}
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
                                        <Label>Mrgin (%)</Label>
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

                                {/* Cuarta fila de campos */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {renderFieldWithComments("Price EA", "priceEA", index,
                                        <Input
                                            type="number"
                                            value={product.priceEA.toFixed(2)}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Ext Price SIMA", "extPriceSIMA", index,
                                        <Input
                                            type="number"
                                            value={product.extPriceSIMA.toFixed(2)}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Extra margin", "extraMargin", index,
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
                                        </Select>,
                                        true
                                    )}
                                </div>

                                {/* Quinta fila de campos */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {renderFieldWithComments("Final Price EA", "finalPriceEA", index,
                                        <Input
                                            type="number"
                                            value={product.finalPriceEA.toFixed(2)}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                    {renderFieldWithComments("Ext Price MXN", "extPriceMXN", index,
                                        <Input
                                            type="number"
                                            value={product.extPriceMXN.toFixed(2)}
                                            readOnly
                                            className="bg-gray-50"
                                        />,
                                        true
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Comments/link</Label>
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
                            <h2 className="text-xl font-semibold mb-4">Profit</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Total margin</Label>
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
                                variant="default"
                                disabled={products.some(p => !p.vendor || !p.quotationContact) ||
                                    createQuotationMutation.isPending}
                            >
                                {createQuotationMutation.isPending ? (
                                    <>
                                        <span className="animate-spin mr-2">⌛</span>
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Cotización'
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>

            {/* Modal de Comentarios */}
            <CommentModal
                isOpen={commentModal.isOpen}
                onClose={() => setCommentModal(prev => ({ ...prev, isOpen: false }))}
                fieldName={commentModal.fieldName}
                currentValue={commentModal.currentValue}
                comments={getCommentsForField(
                    products[commentModal.productIndex] || initialProductState,
                    commentModal.fieldName
                )}
                onAddComment={(comment) => handleAddComment(
                    commentModal.productIndex,
                    commentModal.fieldName,
                    comment
                )}
                onEditComment={(commentId, newValue) => handleEditComment(
                    commentModal.productIndex,
                    commentModal.fieldName,
                    commentId,
                    newValue
                )}
                onDeleteComment={(commentId) => handleDeleteComment(
                    commentModal.productIndex,
                    commentModal.fieldName,
                    commentId
                )}
            />
        </div>
    );
}