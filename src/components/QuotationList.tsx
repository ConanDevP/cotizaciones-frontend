import { useQuotationStore } from '@/store/quotationStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function QuotationList() {
  const quotations = useQuotationStore((state) => state.quotations);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Quotations</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No quotations found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell>
                    {format(new Date(quotation.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{quotation.clientName}</TableCell>
                  <TableCell>{quotation.items.length} items</TableCell>
                  <TableCell className="text-right">
                    ${quotation.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[quotation.status]}
                    >
                      {quotation.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}