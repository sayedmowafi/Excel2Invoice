import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, CheckCircle, Settings, Eye, Loader, Download, MapPin, Moon, Sun, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const steps = [
  { path: 'upload', label: 'Upload', icon: FileSpreadsheet, requiresSession: false },
  { path: 'sheets', label: 'Sheets', icon: FileSpreadsheet, requiresSession: true },
  { path: 'mapping', label: 'Map Columns', icon: MapPin, requiresSession: true },
  { path: 'validation', label: 'Validate', icon: CheckCircle, requiresSession: true },
  { path: 'config', label: 'Configure', icon: Settings, requiresSession: true },
  { path: 'preview', label: 'Preview', icon: Eye, requiresSession: true },
  { path: 'generate', label: 'Generate', icon: Loader, requiresSession: true },
  { path: 'download', label: 'Download', icon: Download, requiresSession: true },
];

export default function Layout() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const currentStep = steps.findIndex((step) => location.pathname.includes(step.path));

  const handleStepClick = (step: typeof steps[0], index: number) => {
    // Only allow navigation to completed steps or current step
    if (index > currentStep) return;

    if (step.path === 'upload') {
      navigate('/upload');
    } else if (sessionId) {
      navigate(`/session/${sessionId}/${step.path}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      if (prevStep) {
        if (prevStep.path === 'upload') {
          navigate('/upload');
        } else if (sessionId) {
          navigate(`/session/${sessionId}/${prevStep.path}`);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Filter steps based on whether we have a session
  const visibleSteps = sessionId
    ? steps
    : steps.filter(s => !s.requiresSession);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <Button variant="ghost" size="icon" onClick={handleBack} title="Go back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1
              className="text-xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              Excel to Invoice
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {sessionId && (
              <span className="text-sm text-muted-foreground">
                Session: {sessionId.slice(0, 8)}...
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {sessionId && (
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {visibleSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isClickable = index <= currentStep;

                return (
                  <div
                    key={step.path}
                    className={`flex items-center ${index < visibleSteps.length - 1 ? 'flex-1' : ''}`}
                  >
                    <button
                      onClick={() => handleStepClick(step, index)}
                      disabled={!isClickable}
                      className={`flex items-center gap-2 transition-all ${
                        isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'
                      } ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : isCompleted
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                            : 'bg-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium hidden sm:block">{step.label}</span>
                    </button>
                    {index < visibleSteps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 ${
                          isCompleted ? 'bg-green-600 dark:bg-green-400' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
