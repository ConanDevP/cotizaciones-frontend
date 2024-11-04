import { create } from 'zustand';

export interface Quotation {
  id: string;
  clientName: string;
  date: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface QuotationStore {
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id'>) => void;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
}

export const useQuotationStore = create<QuotationStore>((set) => ({
  quotations: [],
  addQuotation: (quotation) =>
    set((state) => ({
      quotations: [
        ...state.quotations,
        { ...quotation, id: Math.random().toString(36).substring(7) },
      ],
    })),
  updateQuotation: (id, quotation) =>
    set((state) => ({
      quotations: state.quotations.map((q) =>
        q.id === id ? { ...q, ...quotation } : q
      ),
    })),
}));