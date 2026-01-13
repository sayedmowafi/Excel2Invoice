import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileSpreadsheet, Users, FileText, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

type SheetType = 'customers' | 'invoices' | 'items' | 'skip';

interface SheetAssignment {
  [sheetName: string]: SheetType;
}

export default function SheetSelectionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<SheetAssignment>({});

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Determine if this is multi-sheet mode
      const assignedSheets = Object.entries(assignments)
        .filter(([_, type]) => type !== 'skip')
        .map(([name]) => name);

      const isMultiSheet = assignedSheets.length > 1;

      // Submit the sheet selection
      await api.submitMapping(sessionId!, {
        mappings: [], // Will be auto-detected based on sheets
        sheetMode: isMultiSheet ? 'multi' : 'single',
        selectedSheets: assignedSheets,
      });
    },
    onSuccess: () => {
      navigate(`/session/${sessionId}/mapping`);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  // Auto-detect sheet types based on names
  useState(() => {
    if (sessionData?.session.sheets) {
      const auto: SheetAssignment = {};
      for (const sheet of sessionData.session.sheets) {
        const name = sheet.name.toLowerCase();
        if (name.includes('customer') || name.includes('client') || name.includes('contact')) {
          auto[sheet.name] = 'customers';
        } else if (name.includes('invoice') && !name.includes('item')) {
          auto[sheet.name] = 'invoices';
        } else if (name.includes('item') || name.includes('line') || name.includes('detail')) {
          auto[sheet.name] = 'items';
        } else {
          auto[sheet.name] = 'skip';
        }
      }
      setAssignments(auto);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sheets = sessionData?.session.sheets ?? [];
  const isSingleSheet = sheets.length === 1;

  // If single sheet, skip this page
  if (isSingleSheet) {
    // Auto-navigate to mapping
    navigate(`/session/${sessionId}/mapping`, { replace: true });
    return null;
  }

  const getSheetIcon = (type: SheetType) => {
    switch (type) {
      case 'customers':
        return <Users className="w-5 h-5" />;
      case 'invoices':
        return <FileText className="w-5 h-5" />;
      case 'items':
        return <Package className="w-5 h-5" />;
      default:
        return <FileSpreadsheet className="w-5 h-5" />;
    }
  };

  const getSheetTypeLabel = (type: SheetType) => {
    switch (type) {
      case 'customers':
        return 'Customers';
      case 'invoices':
        return 'Invoices';
      case 'items':
        return 'Line Items';
      default:
        return 'Skip';
    }
  };

  const handleAssignment = (sheetName: string, type: SheetType) => {
    setAssignments((prev) => ({ ...prev, [sheetName]: type }));
  };

  const canContinue = () => {
    const types = Object.values(assignments);
    // Must have at least invoices selected
    return types.includes('invoices') || types.filter(t => t !== 'skip').length >= 1;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Sheets</CardTitle>
          <CardDescription>
            We detected {sheets.length} sheets in your file. Please identify what each sheet contains
            so we can properly link the data together.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sheets.map((sheet) => (
            <div
              key={sheet.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getSheetIcon(assignments[sheet.name] ?? 'skip')}
                <div>
                  <p className="font-medium">{sheet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sheet.rowCount} rows, {sheet.columnCount} columns
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Columns: {sheet.headers.slice(0, 5).join(', ')}
                    {sheet.headers.length > 5 && ` +${sheet.headers.length - 5} more`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['customers', 'invoices', 'items', 'skip'] as SheetType[]).map((type) => (
                  <Button
                    key={type}
                    variant={assignments[sheet.name] === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAssignment(sheet.name, type)}
                  >
                    {getSheetTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Relationship explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Customers</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <FileText className="w-4 h-4 text-green-600" />
              <span>Invoices</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
              <Package className="w-4 h-4 text-purple-600" />
              <span>Line Items</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            We'll link customers to invoices using <code className="px-1 bg-gray-100 rounded">customer_id</code>,
            and line items to invoices using <code className="px-1 bg-gray-100 rounded">invoice_id</code>.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!canContinue() || submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue to Mapping
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
