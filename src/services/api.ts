import axios, { AxiosError } from 'axios';
import { Quotation, Product, StrapiResponse, CreateQuotationData, CreateProductData } from '../types';

const api = axios.create({
    baseURL: 'http://localhost:1337/api'
});

export const getQuotations = async (): Promise<StrapiResponse<Quotation[]>> => {
    try {
        const response = await api.get('/cotizacions', {
            params: {
                populate: '*',  // Populate all relations
                sort: 'createdAt:desc'  // Ordenar por fecha de creación
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener cotizaciones:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};



export const getQuotation = async (documentId: string): Promise<StrapiResponse<Quotation>> => {
    try {
        // Eliminar cualquier espacio y usar el documentId directamente
        const response = await api.get(`/cotizacions/${documentId}`, {
            params: {
                populate: '*'
            }
        });
        console.log('URL usada:', `/cotizacions/${documentId}`); // Para debug
        console.log('Respuesta:', response.data); // Para debug
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener cotización:', {
                url: `/cotizacions/${documentId}`, // Para ver la URL exacta
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};
export const createQuotation = async (quotationData: any): Promise<StrapiResponse<Quotation>> => {
    try {
        // Primero creamos los productos
        const productPromises = quotationData.data.products.map(async (productData: any) => {
            const formattedProduct = {
                data: {
                    ...productData,
                    publishedAt: new Date().toISOString()
                }
            };

            const response = await api.post('/products', formattedProduct);
            return response.data.data.id;
        });

        const productIds = await Promise.all(productPromises);

        // Creamos la cotización con la estructura correcta para Strapi 5.2
        const formattedQuotation = {
            data: {
                title: quotationData.data.title,
                quote_number: quotationData.data.quote_number,
                estado: quotationData.data.estado,
                publishedAt: new Date().toISOString(),
                products: {
                    connect: productIds.map(id => ({ id }))
                }
            }
        };

        const response = await api.post('/cotizacions', formattedQuotation);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al crear cotización:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                request: error.config?.data
            });
        }
        throw error;
    }
};

export const getProducts = async (): Promise<StrapiResponse<Product[]>> => {
    try {
        const response = await api.get('/products', {
            params: {
                populate: '*',
                sort: 'createdAt:desc'
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener productos:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};

export const getProduct = async (documentId: string): Promise<StrapiResponse<Product>> => {
    try {
        const response = await api.get(`/ products / ${documentId} `, {
            params: {
                populate: '*'
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener producto:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};

export const createProduct = async (productData: CreateProductData): Promise<StrapiResponse<Product>> => {
    try {
        const formattedProduct = {
            data: {
                ...productData,
                publishedAt: new Date().toISOString()
            }
        };

        const response = await api.post('/products', formattedProduct);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al crear producto:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};
export const updateQuotation = async (documentId: string, quotationData: any): Promise<StrapiResponse<Quotation>> => {
    try {
        // Primero creamos o actualizamos los productos
        const productPromises = quotationData.products.map(async (productData: any) => {
            const formattedProduct = {
                data: {
                    ...productData,
                    publishedAt: new Date().toISOString()
                }
            };

            // Si el producto tiene ID, actualizamos, si no, creamos nuevo
            if (productData.id) {
                const response = await api.put(`/products/${productData.id}`, formattedProduct);
                return response.data.data.id;
            } else {
                const response = await api.post('/products', formattedProduct);
                return response.data.data.id;
            }
        });

        const productIds = await Promise.all(productPromises);

        // Actualizamos la cotización con la misma estructura que usamos al crear
        const formattedQuotation = {
            data: {
                title: quotationData.title,
                quote_number: quotationData.quote_number,
                estado: quotationData.estado,
                publishedAt: new Date().toISOString(),
                products: {
                    connect: productIds.map(id => ({ id }))
                }
            }
        };

        const response = await api.put(`/cotizacions/${documentId}`, formattedQuotation);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al actualizar cotización:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                request: error.config?.data
            });
        }
        throw error;
    }
};

// También necesitamos un método para eliminar productos si son removidos de la cotización
export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        await api.delete(`/products/${productId}`);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al eliminar producto:', {
                productId,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};


export const deleteQuotation = async (documentId: string): Promise<void> => {
    try {
        await api.delete(`/ cotizacions / ${documentId} `);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al eliminar cotización:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    }
};


export const updateQuotationStatus = async (documentId: string, estado: string): Promise<StrapiResponse<Quotation>> => {
    
    try {
        const response = await api.put(`/cotizacions/${documentId}`, {
            data: {
                estado
            }
        });

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al actualizar estado de cotización:', {
                documentId,
                estado,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        throw error;
    };
   
   
};