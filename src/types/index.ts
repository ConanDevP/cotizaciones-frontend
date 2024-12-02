// src/types/index.ts

// Tipo para un Producto
export interface Product {
    id: number;
    documentId: string;
    vendor: string;
    quotationContact: string;
    freight: number;
    annualQty: number;
    uom: string;
    costC: number;
    costEA: number;
    currency: 'MXN' | 'USD';
    extCost: number;
    shrinkage: 'SI' | 'NO';
    cost1: number;
    cost2: number;
    ivan: 'SI' | 'NO';
    cost3: number;
    extPrecost: number;
    margin: number;
    priceEA: number;
    extPriceSIMA: number;
    extraMargin: number;
    finalPriceEA: number;
    extPriceMXN: number;
    commentsLink: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    customUom: string;
}

// Tipo para la respuesta de Strapi
export interface StrapiResponse<T> {
    data: T;
    meta: {
        pagination?: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

// Tipo para datos de creación de un producto
export interface CreateProductData {

    vendor: string;
    name: string;
    customUom?: string;
    quotationContact: string;
    freight: number;
    annualQty: number;
    uom: string;
    costC: number;
    costEA: number;
    currency: 'MXN' | 'USD';
    extCost: number;
    shrinkage: 'SI' | 'NO';
    cost1: number;
    cost2: number;
    ivan: 'SI' | 'NO';
    cost3: number;
    extPrecost: number;
    margin: number;
    priceEA: number;
    extPriceSIMA: number;
    finalPriceEA: number;
    extPriceMXN: number;
    commentsLink: string;
    extraMargin: 'SI' | 'NO';
    field_comments: []
}

// Tipo para una Cotización
export interface Quotation {
    id: number;
    documentId: string;
    title: string;
    quote_number: string;
    estado: 'VIGENTE' | 'VENCIDA' | 'RECHAZADA';
    products: Product[];
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
   
}

// Tipo para datos de creación de una cotización
export interface CreateQuotationData {
    title: string;
    quote_number: string;
    estado: 'VIGENTE';
    products: CreateProductData[];
}

// Tipo para la respuesta de una cotización individual
export interface QuotationResponse {
    data: Quotation;
    meta: {};
}

// Tipo para la respuesta de lista de cotizaciones
export interface QuotationsResponse {
    data: Quotation[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

// Tipo para los cálculos automáticos de producto
export interface ProductCalculations {
    costEA: number;
    extCost: number;
    cost1: number;
    cost2: number;
    cost3: number;
    extPrecost: number;
    priceEA: number;
    extPriceSIMA: number;
    finalPriceEA: number;
    extPriceMXN: number;
}

// Tipo para errores de la API
export interface ApiError {
    status: number;
    name: string;
    message: string;
    details: Record<string, any>;
}

// Tipo para la respuesta de error de Strapi
export interface StrapiError {
    data: null;
    error: ApiError;
}