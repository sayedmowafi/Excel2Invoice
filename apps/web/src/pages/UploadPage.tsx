import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for now (real progress would need XHR or fetch with streams)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await api.upload(formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: `Found ${data.sheets.length} sheet(s) with data`,
      });

      // Navigate based on number of sheets
      setTimeout(() => {
        if (data.sheets.length > 1) {
          // Multi-sheet file - go to sheet selection
          navigate(`/session/${data.sessionId}/sheets`);
        } else {
          // Single sheet - go directly to mapping
          navigate(`/session/${data.sessionId}/mapping`);
        }
      }, 500);
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadProgress(0);
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    disabled: uploadMutation.isPending,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Your Excel File</CardTitle>
          <CardDescription>
            Drag and drop your file or click to browse. Supports .xlsx, .xls, and .csv files up to 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : isDragReject
                ? 'border-destructive bg-destructive/5'
                : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
            } ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />

            {uploadMutation.isPending ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="font-medium">Uploading...</p>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
                <Progress value={uploadProgress} className="w-48 mx-auto" />
              </div>
            ) : isDragReject ? (
              <div className="space-y-2">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="font-medium text-destructive">Invalid file type</p>
                <p className="text-sm text-muted-foreground">
                  Please use .xlsx, .xls, or .csv files
                </p>
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-primary" />
                <p className="font-medium text-primary">Drop your file here</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-medium">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Single-sheet files (one row = one invoice)</li>
              <li>Multi-row invoices (grouped by invoice number)</li>
              <li>Multi-sheet relational data (customers, invoices, items)</li>
              <li>Accounting software exports (QuickBooks, Xero, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Need help with your data?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Our system can automatically detect common column names like:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-medium">Invoice fields:</p>
              <p className="text-muted-foreground">Invoice #, Date, Due Date</p>
            </div>
            <div>
              <p className="font-medium">Customer fields:</p>
              <p className="text-muted-foreground">Customer Name, Email, Address</p>
            </div>
            <div>
              <p className="font-medium">Item fields:</p>
              <p className="text-muted-foreground">Description, Qty, Price, Total</p>
            </div>
            <div>
              <p className="font-medium">Other fields:</p>
              <p className="text-muted-foreground">Tax Rate, Discount, Notes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
