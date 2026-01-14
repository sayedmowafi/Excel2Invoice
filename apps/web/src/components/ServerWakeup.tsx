import { useState, useEffect } from 'react';
import { Loader2, Server } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';
const COLD_START_ENABLED = import.meta.env.VITE_COLD_START_SCREEN === 'true';

interface ServerWakeupProps {
  children: React.ReactNode;
}

export default function ServerWakeup({ children }: ServerWakeupProps) {
  const [status, setStatus] = useState<'checking' | 'waking' | 'ready' | 'disabled'>('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // If feature is disabled, skip entirely
    if (!COLD_START_ENABLED) {
      setStatus('disabled');
      return;
    }

    let cancelled = false;
    const maxAttempts = 30; // 30 attempts × 2 seconds = 60 seconds max wait

    const checkServer = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok && !cancelled) {
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setStatus('waking');
          setAttempts((prev) => prev + 1);

          if (attempts < maxAttempts) {
            setTimeout(checkServer, 2000);
          }
        }
      }
    };

    checkServer();

    return () => {
      cancelled = true;
    };
  }, [attempts]);

  // Feature disabled - render children immediately
  if (status === 'disabled') {
    return <>{children}</>;
  }

  // Server ready - render children
  if (status === 'ready') {
    return <>{children}</>;
  }

  // Show loading screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <Server className="h-16 w-16 text-muted-foreground" />
            <Loader2 className="h-8 w-8 text-primary animate-spin absolute -bottom-1 -right-1" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {status === 'checking' ? 'Connecting to server...' : 'Waking up server...'}
          </h1>
          <p className="text-muted-foreground">
            {status === 'checking'
              ? 'Please wait while we connect to the server.'
              : 'The server is starting up. This may take up to 30 seconds on first visit.'}
          </p>
        </div>

        {status === 'waking' && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${Math.min((attempts / 15) * 100, 95)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {attempts < 10
                ? 'Server is waking up...'
                : attempts < 20
                  ? 'Almost there...'
                  : 'Taking longer than usual...'}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          This is a demo hosted on a free tier server that sleeps after inactivity.
        </p>
      </div>
    </div>
  );
}
