import axios, { AxiosError } from 'axios';
import { Quotation, Product, StrapiResponse, CreateQuotationData, CreateProductData, FieldComment } from '../types';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
    baseURL: 'https://sistema-cotizaciones-production.up.railway.app/api'
});

// Funciones para manejar comentarios
export const createFieldComment = async (comment: any) => {
    try {
        const response = await api.post('/field-comments', {
            data: comment
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al crear comentario:', error);
        }
        throw error;
    }
};

export const updateFieldComment = async (commentId: number, data: any) => {
    try {
        const response = await api.put(`/field-comments/${commentId}`, {
            data
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al actualizar comentario:', error);
        }
        throw error;
    }
};

export const deleteFieldComment = async (commentId: number) => {
    try {
        await api.delete(`/field-comments/${commentId}`);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al eliminar comentario:', error);
        }
        throw error;
    }
};

// Funciones de cotizaciones
export const getQuotations = async (): Promise<StrapiResponse<Quotation[]>> => {
    try {
        const response = await api.get('/cotizacions', {
            params: {
                populate: ['products', 'products.field_comments'],
                sort: 'createdAt:desc'
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener cotizaciones:', error);
        }
        throw error;
    }
};

export const getQuotation = async (documentId: string): Promise<StrapiResponse<Quotation>> => {
    try {
        const response = await api.get(`/cotizacions/${documentId}`, {
            params: {
                populate: ['products', 'products.field_comments', 'users']
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener cotización:', error);
        }
        throw error;
    }
};

export const createQuotation = async (quotationData: any): Promise<StrapiResponse<Quotation>> => {
    try {
        // Primero creamos los productos y sus comentarios
        const productPromises = quotationData.data.products.map(async (productData: any) => {
            const { field_comments, ...productDetails } = productData;

            const formattedProduct = {
                data: {
                    ...productDetails,
                    publishedAt: new Date().toISOString()
                }
            };

            const productResponse = await api.post('/products', formattedProduct);
            const productId = productResponse.data.data.id;

            if (field_comments && field_comments.length > 0) {
                await Promise.all(field_comments.map(async (comment: any) => {
                    await createFieldComment({
                        ...comment,
                        product: productId,
                        publishedAt: new Date().toISOString()
                    });
                }));
            }

            return productId;
        });

        const productIds = await Promise.all(productPromises);

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
            console.error('Error al crear cotización:', error);
        }
        throw error;
    }
};
export const updateQuotation = async (documentId: string, quotationData: any): Promise<StrapiResponse<Quotation>> => {
    try {
        // Primero actualizamos o creamos los productos
        const productPromises = quotationData.products.map(async (productData: any) => {
         
            const { field_comments, id, ...productDetails } = productData;

            let productId;
            if (id) {
                const formattedProduct = {
                    data: {
                        ...productDetails
                    }
                };

                await api.put(`/products/${id}`, formattedProduct);
                productId = id;

                if (field_comments) {
                    await Promise.all(field_comments.map(async (comment: any) => {
                        if (comment.id) {
                            await updateFieldComment(comment.id, {
                                value: comment.value,
                                field_value: comment.field_value
                            });
                        } else {
                            await createFieldComment({
                                ...comment,
                                product: productId,
                                publishedAt: new Date().toISOString()
                            });
                        }
                    }));
                }
            } else {
                const formattedProduct = {
                    data: {
                        ...productDetails,
                        publishedAt: new Date().toISOString()
                    }
                };
                const response = await api.post('/products', formattedProduct);
                productId = response.data.data.id;

                if (field_comments) {
                    await Promise.all(field_comments.map(async (comment: any) => {
                        await createFieldComment({
                            ...comment,
                            product: productId,
                            publishedAt: new Date().toISOString()
                        });
                    }));
                }
            }

            return productId;
        });

        const productIds = await Promise.all(productPromises);
        // Actualizamos la cotización
        const user = useAuthStore.getState().user
        console.log(user)
        const formattedQuotation = {
            data: {
                title: quotationData.title,
                quote_number: quotationData.quote_number,
                estado: quotationData.estado,
                date_edit: new Date().toISOString(), 
                edit: true, 
                users: [user?.id],
                products: {
                    set: productIds
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
                message: error.message
            });
        }
        throw error;
    }
};
export const deleteQuotation = async (documentId: string): Promise<void> => {
    try {
        await api.delete(`/cotizacions/${documentId}`);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al eliminar cotización:', error);
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
            console.error('Error al actualizar estado de cotización:', error);
        }
        throw error;
    }
};

// Funciones de productos
export const getProducts = async (): Promise<StrapiResponse<Product[]>> => {
    try {
        const response = await api.get('/products', {
            params: {
                populate: ['field_comments'],
                sort: 'createdAt:desc'
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener productos:', error);
        }
        throw error;
    }
};

export const getProduct = async (documentId: string): Promise<StrapiResponse<Product>> => {
    try {
        const response = await api.get(`/products/${documentId}`, {
            params: {
                populate: ['field_comments']
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al obtener producto:', error);
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
            console.error('Error al crear producto:', error);
        }
        throw error;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        await api.delete(`/products/${productId}`);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error('Error al eliminar producto:', error);
        }
        throw error;
    }
};