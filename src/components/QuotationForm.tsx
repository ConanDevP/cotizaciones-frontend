import { useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useQuotationStore } from '@/store/quotationStore';
import { toast } from 'sonner';

export default function QuotationForm() {
  const navigate = useNavigate();
  const addQuotation = useQuotationStore((state) => state.addQuotation);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">New Quotation</h1>
      <Formik
        initialValues={{
          clientName: '',
          date: new Date().toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
          status: 'pending' as const,
        }}
        onSubmit={(values) => {
          const total = values.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );
          addQuotation({ ...values, total });
          toast.success('Quotation created successfully');
          navigate('/');
        }}
      >
        {({ values, handleChange, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    value={values.clientName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={values.date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <FieldArray name="items">
                {({ push, remove }) => (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Items</h2>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          push({ description: '', quantity: 1, unitPrice: 0 })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                    {values.items.map((_, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[2fr,1fr,1fr,auto] gap-4 items-end"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.description`}>
                            Description
                          </Label>
                          <Input
                            id={`items.${index}.description`}
                            name={`items.${index}.description`}
                            value={values.items[index].description}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.quantity`}>
                            Quantity
                          </Label>
                          <Input
                            id={`items.${index}.quantity`}
                            name={`items.${index}.quantity`}
                            type="number"
                            min="1"
                            value={values.items[index].quantity}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`items.${index}.unitPrice`}>
                            Unit Price
                          </Label>
                          <Input
                            id={`items.${index}.unitPrice`}
                            name={`items.${index}.unitPrice`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={values.items[index].unitPrice}
                            onChange={handleChange}
                          />
                        </div>
                        {values.items.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Quotation</Button>
              </div>
            </Card>
          </Form>
        )}
      </Formik>
    </div>
  );
}