"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  FileText, 
  X, 
  Table,
  Plus,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface FileData {
  id: string;
  name: string;
  content: string;
  rows: string[][];
}

export default function CSVCombinerPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [combinedData, setCombinedData] = useState<string[][]>([]);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please upload only CSV files' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const rows = content.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        
        const newFile: FileData = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          content: content,
          rows: rows.filter(row => row.some(cell => cell !== ''))
        };
        
        setFiles(prev => [...prev, newFile]);
        setMessage({ type: 'success', text: `${file.name} uploaded successfully` });
      };
      reader.readAsText(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const combineFiles = () => {
    if (files.length === 0) {
      setMessage({ type: 'error', text: 'Please upload at least one CSV file' });
      return;
    }

    let combined: string[][] = [];
    
    files.forEach((file, index) => {
      if (includeHeaders || index === 0) {
        combined = [...combined, ...file.rows];
      } else {
        // Skip header row for subsequent files
        combined = [...combined, ...file.rows.slice(1)];
      }
    });

    setCombinedData(combined);
    setMessage({ type: 'success', text: 'Files combined successfully!' });
  };

  const downloadCombined = () => {
    if (combinedData.length === 0) {
      setMessage({ type: 'error', text: 'No combined data to download' });
      return;
    }

    const csvContent = combinedData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Combined CSV downloaded successfully!' });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b">
          <div className="container py-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Table className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CSV Combiner</h1>
                <p className="text-muted-foreground">Combine multiple CSV files into one</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">Combiner</Badge>
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">Data Processing</Badge>
            </div>
          </div>
        </section>

        <div className="container py-8">
          {/* Message Alert */}
          {message && (
            <div className={`mb-6 flex items-center gap-2 rounded-lg border p-4 ${
              message.type === 'success' 
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200' 
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV Files</CardTitle>
                <CardDescription>
                  Select multiple CSV files to combine them into a single file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div 
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-muted-foreground/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV files only • Multiple files supported
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Uploaded Files ({files.length})</h3>
                      {files.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.rows.length} rows
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Options */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeHeaders"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="includeHeaders" className="text-sm">
                      Include headers from all files (uncheck to use only first file&apos;s header)
                    </label>
                  </div>

                  {/* Combine Button */}
                  <Button 
                    onClick={combineFiles} 
                    className="w-full"
                    disabled={files.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Combine Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle>Combined Preview</CardTitle>
                <CardDescription>
                  Preview of your combined CSV data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {combinedData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Preview Table */}
                    <div className="overflow-auto rounded-lg border">
                      <table className="w-full">
                        <tbody>
                          {combinedData.slice(0, 10).map((row, i) => (
                            <tr key={i} className={i === 0 ? "bg-muted/50 font-medium" : ""}>
                              {row.map((cell, j) => (
                                <td key={j} className="border-r px-3 py-2 text-sm">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {combinedData.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Showing first 10 rows of {combinedData.length} total rows
                      </p>
                    )}

                    {/* Download Button */}
                    <Button onClick={downloadCombined} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Combined CSV
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Table className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Upload and combine files to see preview
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                <li>Click the upload area or drag and drop your CSV files</li>
                <li>Upload multiple CSV files that you want to combine</li>
                <li>Choose whether to include headers from all files or just the first one</li>
                <li>Click &quot;Combine Files&quot; to merge all uploaded CSV files</li>
                <li>Preview the combined data in the right panel</li>
                <li>Download your combined CSV file</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}