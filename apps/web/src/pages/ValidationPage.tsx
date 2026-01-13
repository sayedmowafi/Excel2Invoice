import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, AlertCircle, AlertTriangle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';

export default function ValidationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['validation', sessionId],
    queryFn: () => api.validate(sessionId!),
    enabled: !!sessionId,
    staleTime: 0, // Always re-validate
    refetchOnMount: 'always', // Re-run validation when page is mounted
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Validating your data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-10 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Validation failed</p>
        </CardContent>
      </Card>
    );
  }

  const { stats, result } = data ?? { stats: { total: 0, valid: 0, warnings: 0, errors: 0 }, result: null };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-sm text-muted-foreground">Valid</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.warnings}</div>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              Validation Results
            </CardTitle>
            <CardDescription>
              {result.isValid
                ? 'All invoices passed validation'
                : `${stats.errors} invoices have errors and will be skipped`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.errors.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-destructive">Errors ({result.errors.length})</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {err.message}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground italic">
                      ... and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings ({result.warnings.length})</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.warnings.slice(0, 10).map((warn, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {warn.message}
                    </p>
                  ))}
                  {result.warnings.length > 10 && (
                    <p className="text-sm text-muted-foreground italic">
                      ... and {result.warnings.length - 10} more warnings
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <a href={api.getErrorReportUrl(sessionId!)} download>
            <Download className="w-4 h-4 mr-2" />
            Download Error Report
          </a>
        </Button>
        <Button onClick={() => navigate(`/session/${sessionId}/config`)}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Continue with {stats.valid} Valid Invoices
        </Button>
      </div>
    </div>
  );
}
