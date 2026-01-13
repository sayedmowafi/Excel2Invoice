import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2 } from 'lucide-react';
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
              className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
              className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2"
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
