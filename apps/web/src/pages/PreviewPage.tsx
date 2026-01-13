import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';

export default function PreviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const invoices = data?.session.invoices ?? [];
  const validInvoices = invoices.filter((inv) => inv.status !== 'error');
  const currentInvoice = validInvoices[currentIndex];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview Your Invoices</CardTitle>
          <CardDescription>
            Reviewing invoice {currentIndex + 1} of {validInvoices.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentInvoice && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">{data?.session.config?.company.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {data?.session.config?.company.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Invoice #{currentInvoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(currentInvoice.issueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground">Bill To:</p>
                <p className="font-medium">{currentInvoice.customer.name}</p>
                {currentInvoice.customer.address?.line1 && (
                  <p className="text-sm">{currentInvoice.customer.address.line1}</p>
                )}
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.lineItems.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">
                        {data?.session.config?.currencySymbol}
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        {data?.session.config?.currencySymbol}
                        {item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-48">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>
                      {data?.session.config?.currencySymbol}
                      {currentInvoice.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {currentInvoice.totalTax > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Tax:</span>
                      <span>
                        {data?.session.config?.currencySymbol}
                        {currentInvoice.totalTax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 font-bold border-t mt-2 pt-2">
                    <span>Total:</span>
                    <span>
                      {data?.session.config?.currencySymbol}
                      {currentInvoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.min(validInvoices.length - 1, i + 1))}
              disabled={currentIndex >= validInvoices.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">Ready to Generate</p>
              <p className="text-muted-foreground">
                {validInvoices.length} invoices will be generated as PDFs
              </p>
            </div>
            <Button onClick={() => navigate(`/session/${sessionId}/generate`)}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Generate PDFs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
