import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { DEFAULT_CONFIG, type GenerationConfig, CURRENCIES } from '@excel-to-invoice/shared';

export default function ConfigPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Logo must be less than 2MB',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        company: { ...prev.company, logo: base64 },
      }));
      toast({
        title: 'Logo uploaded',
        description: 'Your company logo has been added',
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setConfig((prev) => ({
      ...prev,
      company: { ...prev.company, logo: undefined },
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch session to load saved config (for when user navigates back)
  const { data: sessionData } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Initialize config from saved session config if available
  useEffect(() => {
    if (sessionData?.session?.config) {
      setConfig(sessionData.session.config);
    }
  }, [sessionData]);

  const saveMutation = useMutation({
    mutationFn: () => api.saveConfig(sessionId!, config),
    onSuccess: () => {
      navigate(`/session/${sessionId}/preview`);
    },
    onError: (err: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save configuration',
        description: err.message,
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>This information will appear on your invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
              value={config.company.name}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  company: { ...prev.company, name: e.target.value },
                }))
              }
              placeholder="Your Company Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.company.phone ?? ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    company: { ...prev.company, phone: e.target.value },
                  }))
                }
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.company.email ?? ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    company: { ...prev.company, email: e.target.value },
                  }))
                }
                placeholder="invoices@company.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
              rows={2}
              value={config.company.address ?? ''}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  company: { ...prev.company, address: e.target.value },
                }))
              }
              placeholder="123 Business St&#10;City, State 12345"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.company.website ?? ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    company: { ...prev.company, website: e.target.value },
                  }))
                }
                placeholder="https://www.company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax ID / VAT Number</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.company.taxId ?? ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    company: { ...prev.company, taxId: e.target.value },
                  }))
                }
                placeholder="TAX-123456789"
              />
            </div>
          </div>
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Company Logo</label>
            <p className="text-xs text-muted-foreground mb-2">
              Used in "Simple + Logo" and "Professional" templates. Max 2MB (PNG, JPG)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            {config.company.logo ? (
              <div className="flex items-center gap-4">
                <div className="relative border rounded-lg p-2 bg-white">
                  <img
                    src={config.company.logo}
                    alt="Company logo"
                    className="h-16 w-auto max-w-[200px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    title="Remove logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Logo
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed rounded-lg p-4 w-full text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Image className="w-8 h-8" />
                <div className="text-left">
                  <div className="font-medium">Upload Logo</div>
                  <div className="text-xs">Click to browse or drag and drop</div>
                </div>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Template</CardTitle>
          <CardDescription>Choose a template style for your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { id: 'simple', name: 'Simple', desc: 'Clean & minimal' },
              { id: 'simple-logo', name: 'Simple + Logo', desc: 'With company logo' },
              { id: 'professional', name: 'Professional', desc: 'Modern design' },
              { id: 'tax-invoice', name: 'Tax Invoice', desc: 'Compliance-focused' },
            ].map((template) => (
              <button
                key={template.id}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  config.template === template.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-gray-400'
                }`}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    template: template.id as GenerationConfig['template'],
                  }))
                }
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground">{template.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency & Formatting */}
      <Card>
        <CardHeader>
          <CardTitle>Currency & Formatting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.currency}
                onChange={(e) => {
                  const currency = CURRENCIES.find((c) => c.code === e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    currency: e.target.value,
                    currencySymbol: currency?.symbol ?? e.target.value,
                    currencyPosition: currency?.symbolPosition ?? 'before',
                  }));
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Format</label>
              <select
                className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
                value={config.dateFormat}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dateFormat: e.target.value as GenerationConfig['dateFormat'],
                  }))
                }
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-25)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (25 Dec 2024)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Text</CardTitle>
          <CardDescription>Custom message at the bottom of invoices (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full border rounded px-3 py-2 bg-background text-foreground border-input"
            rows={2}
            value={config.footerText ?? ''}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, footerText: e.target.value }))
            }
            placeholder="Thank you for your business!"
            maxLength={500}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !config.company.name}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Continue to Preview
        </Button>
      </div>
    </div>
  );
}
