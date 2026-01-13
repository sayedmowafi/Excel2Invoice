import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, Zap, Palette, Download, Shield, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

const features = [
  {
    icon: FileSpreadsheet,
    title: 'Multiple Excel Formats',
    description: 'Support for .xlsx, .xls, .csv files. Works with single-sheet, multi-row, and relational data.',
  },
  {
    icon: Zap,
    title: 'Smart Column Detection',
    description: 'Automatically detects and maps your column headers to invoice fields using fuzzy matching.',
  },
  {
    icon: Palette,
    title: '4 Professional Templates',
    description: 'Choose from Simple, Simple+Logo, Professional, or Tax Invoice templates.',
  },
  {
    icon: Download,
    title: 'Bulk PDF Generation',
    description: 'Generate hundreds or thousands of invoices at once. Download as ZIP.',
  },
  {
    icon: Shield,
    title: 'Data Validation',
    description: 'Comprehensive validation with clear error messages and CSV reports.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency Support',
    description: '50+ currencies with customizable formatting for dates and numbers.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header with theme toggle */}
      <header className="absolute top-0 right-0 p-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Transform Excel into
            <span className="text-primary"> Professional Invoices</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your Excel file and generate beautiful PDF invoices in bulk.
            Works with messy real-world data from any source.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/upload')}
          >
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Upload Excel File
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Supports .xlsx, .xls, and .csv files up to 50MB
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow bg-card">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {[
              { step: '1', title: 'Upload', desc: 'Upload your Excel file' },
              { step: '2', title: 'Map', desc: 'Map columns to invoice fields' },
              { step: '3', title: 'Configure', desc: 'Add your company info' },
              { step: '4', title: 'Generate', desc: 'Download your PDFs' },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block w-16 h-0.5 bg-border mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground">
        <p>Open source project for educational purposes</p>
        <p className="text-sm mt-2">Not for commercial use</p>
      </footer>
    </div>
  );
}
