import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotations, createQuotation } from '../services/api';

export const useQuotations = () => {
    return useQuery({
        queryKey: ['quotations'],
        queryFn: getQuotations
    });
};

export const useCreateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
        }
    });
};