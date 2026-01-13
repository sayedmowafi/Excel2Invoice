import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight, Check, AlertCircle, Users, FileText, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import type { ColumnMapping } from '@excel-to-invoice/shared';

// Required fields that must be mapped across ALL sheets combined
const REQUIRED_FIELDS = ['invoiceNumber', 'customerName', 'description', 'unitPrice'];

// All available fields for mapping - expanded to support relational data
const ALL_FIELDS = [
  // Required fields
  { value: 'invoiceNumber', label: 'Invoice Number', required: true, category: 'invoice' },
  { value: 'customerName', label: 'Customer Name', required: true, category: 'customer' },
  { value: 'description', label: 'Description', required: true, category: 'item' },
  { value: 'unitPrice', label: 'Unit Price', required: true, category: 'item' },

  // Invoice fields
  { value: 'invoiceId', label: 'Invoice ID (for linking)', required: false, category: 'invoice' },
  { value: 'issueDate', label: 'Issue Date', required: false, category: 'invoice' },
  { value: 'dueDate', label: 'Due Date', required: false, category: 'invoice' },
  { value: 'currency', label: 'Currency', required: false, category: 'invoice' },
  { value: 'status', label: 'Invoice Status', required: false, category: 'invoice' },
  { value: 'poNumber', label: 'PO Number', required: false, category: 'invoice' },
  { value: 'notes', label: 'Notes', required: false, category: 'invoice' },

  // Customer fields
  { value: 'customerId', label: 'Customer ID (for linking)', required: false, category: 'customer' },
  { value: 'customerEmail', label: 'Customer Email', required: false, category: 'customer' },
  { value: 'customerPhone', label: 'Customer Phone', required: false, category: 'customer' },
  { value: 'customerAddress', label: 'Customer Address', required: false, category: 'customer' },
  { value: 'customerCompany', label: 'Company Name', required: false, category: 'customer' },
  { value: 'customerCity', label: 'City', required: false, category: 'customer' },
  { value: 'customerState', label: 'State/Province', required: false, category: 'customer' },
  { value: 'customerCountry', label: 'Country', required: false, category: 'customer' },
  { value: 'customerPostalCode', label: 'Postal Code', required: false, category: 'customer' },
  { value: 'customerTaxId', label: 'Customer Tax ID', required: false, category: 'customer' },

  // Line item fields
  { value: 'quantity', label: 'Quantity', required: false, category: 'item' },
  { value: 'lineTotal', label: 'Line Total', required: false, category: 'item' },
  { value: 'taxRate', label: 'Tax Rate', required: false, category: 'item' },
  { value: 'discount', label: 'Discount', required: false, category: 'item' },
];

export default function MappingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Per-sheet mappings: { sheetName: { sourceColumn: targetField } }
  const [sheetMappings, setSheetMappings] = useState<Record<string, Record<string, string>>>({});
  const [activeSheet, setActiveSheet] = useState<string>('');

  // Fetch auto-detected column mappings
  const { data, isLoading, error } = useQuery({
    queryKey: ['columns', sessionId],
    queryFn: () => api.getColumnMappings(sessionId!),
    enabled: !!sessionId,
  });

  // Also fetch session to get saved mappings (for when user navigates back)
  const { data: sessionData } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Initialize mappings - prefer saved mappings from session, fallback to auto-detected
  useEffect(() => {
    if (data) {
      const savedMappings = sessionData?.session?.columnMappings;
      const hasSavedMappings = savedMappings && savedMappings.length > 0;
      const isMultiSheet = data.isMultiSheet && data.sheetMappings && data.sheets;

      if (isMultiSheet && data.sheets) {
        // Multi-sheet mode: initialize mappings for each sheet
        const initial: Record<string, Record<string, string>> = {};

        for (const sheet of data.sheets) {
          initial[sheet.name] = {};

          if (hasSavedMappings) {
            // Use saved mappings for this sheet
            savedMappings
              .filter((m: ColumnMapping & { sheetName?: string }) => m.sheetName === sheet.name)
              .forEach((m: ColumnMapping) => {
                if (m.targetField) {
                  initial[sheet.name][m.sourceColumn] = m.targetField;
                }
              });
          }

          // Fill in any missing columns with auto-detected mappings
          const sheetAutoMappings = data.sheetMappings?.[sheet.name] ?? [];
          sheetAutoMappings.forEach((m: ColumnMapping) => {
            if (m.targetField && !initial[sheet.name][m.sourceColumn]) {
              initial[sheet.name][m.sourceColumn] = m.targetField;
            }
          });
        }

        setSheetMappings(initial);
        if (data.sheets.length > 0) {
          setActiveSheet(data.sheets[0].name);
        }
      } else {
        // Single-sheet mode
        const initial: Record<string, string> = {};
        const sheetName = data.sheets?.[0]?.name ?? 'Sheet1';

        if (hasSavedMappings) {
          // Use saved mappings
          savedMappings.forEach((m: ColumnMapping) => {
            if (m.targetField) {
              initial[m.sourceColumn] = m.targetField;
            }
          });
        }

        // Fill in any missing columns with auto-detected mappings
        data.mappings.forEach((m: ColumnMapping) => {
          if (m.targetField && !initial[m.sourceColumn]) {
            initial[m.sourceColumn] = m.targetField;
          }
        });

        setSheetMappings({ [sheetName]: initial });
        setActiveSheet(sheetName);
      }
    }
  }, [data, sessionData]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Flatten all mappings into a single array
      const allMappings: Array<{ sourceColumn: string; targetField: string; sheetName?: string }> = [];

      for (const [sheetName, mappings] of Object.entries(sheetMappings)) {
        for (const [source, target] of Object.entries(mappings)) {
          if (target) {
            allMappings.push({
              sourceColumn: source,
              targetField: target,
              sheetName,
            });
          }
        }
      }

      const isMultiSheet = data?.isMultiSheet ?? false;
      const selectedSheets = data?.sheets?.map(s => s.name) ?? [];

      await api.submitMapping(sessionId!, {
        mappings: allMappings,
        sheetMode: isMultiSheet ? 'multi' : 'single',
        selectedSheets: isMultiSheet ? selectedSheets : undefined,
      });
    },
    onSuccess: () => {
      navigate(`/session/${sessionId}/validation`);
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save mappings',
        description: err.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-10 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load column data</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate all mapped fields across ALL sheets
  const allMappedFields = new Set<string>();
  for (const mappings of Object.values(sheetMappings)) {
    for (const target of Object.values(mappings)) {
      if (target) {
        allMappedFields.add(target);
      }
    }
  }

  const missingRequired = REQUIRED_FIELDS.filter((f) => !allMappedFields.has(f));
  const isMultiSheet = data?.isMultiSheet && data.sheets && data.sheets.length > 1;

  const getSheetIcon = (sheetName: string) => {
    const name = sheetName.toLowerCase();
    if (name.includes('customer') || name.includes('client')) {
      return <Users className="w-4 h-4" />;
    } else if (name.includes('invoice') && !name.includes('item')) {
      return <FileText className="w-4 h-4" />;
    } else if (name.includes('item') || name.includes('line') || name.includes('detail')) {
      return <Package className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const updateMapping = (sheetName: string, sourceColumn: string, targetField: string) => {
    setSheetMappings((prev) => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        [sourceColumn]: targetField,
      },
    }));
  };

  const renderMappingTable = (sheetName: string, mappings: ColumnMapping[]) => {
    const currentMappings = sheetMappings[sheetName] ?? {};

    return (
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-muted-foreground border-b">
            <th className="pb-3 font-medium">Your Column</th>
            <th className="pb-3 font-medium">Maps To</th>
            <th className="pb-3 font-medium">Sample Values</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.sourceColumn} className="border-b">
              <td className="py-3 font-mono text-sm">{mapping.sourceColumn}</td>
              <td className="py-3">
                <select
                  className="w-full border rounded px-2 py-1 text-sm bg-background text-foreground border-input"
                  value={currentMappings[mapping.sourceColumn] ?? mapping.targetField ?? ''}
                  onChange={(e) => updateMapping(sheetName, mapping.sourceColumn, e.target.value)}
                >
                  <option value="">-- Select --</option>
                  <optgroup label="Required Fields">
                    {ALL_FIELDS.filter(f => f.required).map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label} *
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Invoice Fields">
                    {ALL_FIELDS.filter(f => !f.required && f.category === 'invoice').map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Customer Fields">
                    {ALL_FIELDS.filter(f => !f.required && f.category === 'customer').map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Line Item Fields">
                    {ALL_FIELDS.filter(f => !f.required && f.category === 'item').map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </td>
              <td className="py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                {mapping.sampleValues.slice(0, 2).join(', ')}
              </td>
              <td className="py-3">
                {mapping.confidence >= 80 ? (
                  <span className="inline-flex items-center text-green-600 text-sm">
                    <Check className="w-4 h-4 mr-1" />
                    {mapping.confidence}%
                  </span>
                ) : mapping.confidence > 0 ? (
                  <span className="text-yellow-600 text-sm">{mapping.confidence}%</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Manual</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Map Your Columns</CardTitle>
          <CardDescription>
            {isMultiSheet
              ? `We detected ${data.sheets?.length} sheets with relational data. Map columns from each sheet to the appropriate fields.`
              : 'We detected your column headers and made some suggestions. Review and adjust the mappings below.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMultiSheet && data.sheets ? (
            // Multi-sheet view with tabs
            <Tabs value={activeSheet} onValueChange={setActiveSheet}>
              <TabsList className="mb-4">
                {data.sheets.map((sheet) => (
                  <TabsTrigger key={sheet.name} value={sheet.name} className="flex items-center gap-2">
                    {getSheetIcon(sheet.name)}
                    <span>{sheet.name}</span>
                    <span className="text-xs text-muted-foreground">({sheet.rowCount} rows)</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {data.sheets.map((sheet) => (
                <TabsContent key={sheet.name} value={sheet.name}>
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Columns:</strong> {sheet.headers.join(', ')}
                    </p>
                  </div>
                  {renderMappingTable(
                    sheet.name,
                    data.sheetMappings?.[sheet.name] ?? []
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Single-sheet view
            <div className="space-y-4">
              {renderMappingTable(
                activeSheet || 'Sheet1',
                data?.mappings ?? []
              )}
            </div>
          )}

          {/* Summary of mapped required fields across all sheets */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Required Field Status (across all sheets):</p>
            <div className="flex flex-wrap gap-2">
              {REQUIRED_FIELDS.map((field) => {
                const isMapped = allMappedFields.has(field);
                return (
                  <span
                    key={field}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      isMapped
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isMapped ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {field}
                  </span>
                );
              })}
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Missing required fields:</strong> {missingRequired.join(', ')}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Make sure these fields are mapped in at least one of your sheets.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relational data explanation for multi-sheet */}
      {isMultiSheet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Relational Data Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Customers</span>
              </div>
              <span className="text-muted-foreground">linked by Customer ID</span>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Invoices</span>
              </div>
              <span className="text-muted-foreground">linked by Invoice ID</span>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Line Items</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Map <code className="px-1 bg-muted rounded">customer_id</code> in both customers and invoices sheets,
              and <code className="px-1 bg-muted rounded">invoice_id</code> in both invoices and items sheets to link the data together.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || missingRequired.length > 0}
        >
          {submitMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Continue to Validation
        </Button>
      </div>
    </div>
  );
}
