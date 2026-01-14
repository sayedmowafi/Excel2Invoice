import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, CheckCircle, FileSpreadsheet, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';

// Demo limit - only applied when VITE_MAX_INVOICES is set
const MAX_INVOICES = import.meta.env.VITE_MAX_INVOICES ? parseInt(import.meta.env.VITE_MAX_INVOICES) : 0;

export default function DownloadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const stats = data?.session.stats ?? { total: 0, valid: 0, warnings: 0, errors: 0 };

  // Calculate actual generated count (limited by MAX_INVOICES if set)
  const generatedCount = MAX_INVOICES > 0 ? Math.min(stats.valid, MAX_INVOICES) : stats.valid;
  const wasLimited = MAX_INVOICES > 0 && stats.valid > MAX_INVOICES;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-green-600/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Generation Complete!</CardTitle>
          <CardDescription>Your invoices have been generated successfully</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{generatedCount}</div>
              <p className="text-sm text-muted-foreground">Generated</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.warnings}</div>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors}</div>
              <p className="text-sm text-muted-foreground">Skipped</p>
            </div>
          </div>

          {wasLimited && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Demo limit applied:</span> Generated {generatedCount} of {stats.valid} valid invoices.
                  Self-host for unlimited invoices.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <a href={api.getDownloadUrl(sessionId!)} download>
                <Download className="w-5 h-5 mr-2" />
                Download All Invoices (ZIP)
              </a>
            </Button>

            {stats.errors > 0 && (
              <Button variant="outline" className="w-full" asChild>
                <a href={api.getErrorReportUrl(sessionId!)} download>
                  Download Error Report (CSV)
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/upload')}
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Upload Another File
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/session/${sessionId}/config`)}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Adjust Settings & Regenerate
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Your session will expire in 1 hour.</p>
        <p>Files are automatically deleted after expiry.</p>
      </div>
    </div>
  );
}
