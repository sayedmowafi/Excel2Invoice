import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function GeneratePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [status, setStatus] = useState<'connecting' | 'generating' | 'complete' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  // Fetch session to get total count
  const { data: sessionData } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generate(sessionId!),
    onSuccess: (data) => {
      console.log('Generation started:', data.jobId);
      setProgress(prev => ({ ...prev, total: data.totalInvoices }));
      setStatus('generating');
    },
    onError: (err: Error) => {
      console.error('Generation failed:', err);
      setError(err.message);
      setStatus('error');
    },
  });

  // Connect to WebSocket on the API server
  useEffect(() => {
    let connectionTimeout: NodeJS.Timeout;

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 3,
    });

    // Set a timeout to show error if connection takes too long
    connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        setError(`Cannot connect to API server at ${API_URL}. Make sure the API server is running (cd apps/api && npm run dev)`);
        setStatus('error');
      }
    }, 10000);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      clearTimeout(connectionTimeout);
      newSocket.emit('join-session', sessionId);
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      clearTimeout(connectionTimeout);
      setError(`Cannot connect to API server. Make sure the API server is running on ${API_URL}`);
      setStatus('error');
    });

    newSocket.on('progress', (data) => {
      console.log('Progress update:', data);
      setProgress({
        current: data.progress,
        total: data.total,
        percentage: data.percentage,
      });
      setCurrentInvoice(data.currentInvoice);
      setStatus('generating');
    });

    newSocket.on('completed', (data) => {
      console.log('Generation completed:', data);
      setStatus('complete');
      setProgress(prev => ({ ...prev, percentage: 100 }));
      setTimeout(() => {
        navigate(`/session/${sessionId}/download`);
      }, 2000);
    });

    newSocket.on('error', (data) => {
      console.error('Generation error:', data.error);
      setError(data.error);
      setStatus('error');
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(connectionTimeout);
      newSocket.emit('leave-session', sessionId);
      newSocket.close();
    };
  }, [sessionId, navigate]);

  // Start generation once socket is connected
  useEffect(() => {
    if (socket?.connected && !hasStarted.current && !generateMutation.isPending && !generateMutation.data) {
      hasStarted.current = true;
      generateMutation.mutate();
    }
  }, [socket?.connected, generateMutation]);

  const totalInvoices = sessionData?.session?.stats?.valid ?? progress.total;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'complete'
              ? 'Generation Complete!'
              : status === 'error'
              ? 'Generation Failed'
              : 'Generating Your Invoices'}
          </CardTitle>
          <CardDescription>
            {status === 'complete'
              ? 'Redirecting to download...'
              : status === 'error'
              ? 'An error occurred during generation'
              : 'Please wait while we generate your PDF invoices'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center py-8">
            {status === 'complete' ? (
              <div className="text-green-600 dark:text-green-400 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">All invoices generated successfully!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {progress.current} invoices ready for download
                </p>
              </div>
            ) : status === 'error' ? (
              <div className="text-red-600 dark:text-red-400 text-center max-w-md">
                <XCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">Connection Failed</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <div className="mt-4 p-4 bg-muted rounded-lg text-left text-sm text-foreground">
                  <p className="font-medium mb-2">To fix this, run the API server:</p>
                  <code className="block bg-background p-2 rounded font-mono text-xs">
                    cd apps/api && npm run dev
                  </code>
                  <p className="mt-2 text-muted-foreground">
                    The API server should be running on port 3001
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    hasStarted.current = false;
                    setError(null);
                    setStatus('connecting');
                    generateMutation.reset();
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                <div className="w-full max-w-md space-y-4">
                  <Progress value={progress.percentage} />
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      {progress.current} of {totalInvoices || progress.total || '...'} invoices
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {progress.percentage}% complete
                    </p>
                    {currentInvoice && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Processing: <span className="font-mono">{currentInvoice}</span>
                      </p>
                    )}
                    {status === 'connecting' && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        Connecting to server...
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
