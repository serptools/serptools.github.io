"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  FileJson, 
  Table,
  Download,
  Copy,
  FileText,
  Settings,
  ArrowRight,
  Sparkles,
  Check,
  Upload
} from "lucide-react";

export default function JSONToCSVPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [csvOutput, setCsvOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleCopy = () => {
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sample data for demonstration
  const sampleJSON = `[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 25
  }
]`;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container relative py-12">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <FileJson className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-green-500/20 rounded-full"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <Table className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Badge className="mb-4" variant="secondary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Free Converter Tool
                </Badge>
                <h1 className="mb-4 text-4xl font-bold tracking-tight">
                  JSON to CSV Converter
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Transform your JSON data into CSV format instantly. Perfect for spreadsheets, 
                  data analysis, and database imports.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-8">
          <div className="mx-auto max-w-6xl">
            {/* Main Converter Section */}
            <Card className="mb-8 overflow-hidden shadow-lg">
              <div className="grid lg:grid-cols-2">
                {/* Input Section */}
                <div className="relative border-b lg:border-b-0 lg:border-r">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
                    <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileJson className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">JSON Input</h3>
                            <p className="text-xs text-muted-foreground">Source data</p>
                          </div>
                        </div>
                        <TabsList className="h-9 bg-background/50">
                          <TabsTrigger value="text" className="text-xs data-[state=active]:bg-background">
                            <FileText className="mr-1.5 h-3 w-3" />
                            Text
                          </TabsTrigger>
                          <TabsTrigger value="file" className="text-xs data-[state=active]:bg-background">
                            <Upload className="mr-1.5 h-3 w-3" />
                            File
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6">
                      <TabsContent value="text" className="mt-0 h-full space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Paste your JSON data</Label>
                          <textarea
                            className="min-h-[380px] w-full rounded-lg border-2 border-input bg-background p-4 font-mono text-sm transition-colors focus:border-primary focus:outline-none"
                            placeholder='[{"key": "value"}]'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setJsonInput(sampleJSON)}
                          className="w-full sm:w-auto"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Load Sample Data
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="file" className="mt-0 h-full">
                        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/50">
                          <div className="rounded-full bg-primary/10 p-4">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <p className="mt-4 text-sm font-medium">
                            Drop your JSON file here
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            or click to browse from your computer
                          </p>
                          <Button variant="secondary" size="sm" className="mt-4">
                            Choose File
                          </Button>
                          <p className="mt-4 text-xs text-muted-foreground">
                            Supports .json files up to 10MB
                          </p>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>

                {/* Output Section */}
                <div className="relative flex flex-col">
                  <div className="bg-gradient-to-l from-green-500/5 to-transparent px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                          <Table className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">CSV Output</h3>
                          <p className="text-xs text-muted-foreground">Converted data</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCopy}
                          disabled={!csvOutput}
                          className="h-9 px-3"
                        >
                          {copied ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={!csvOutput}
                          className="h-9 px-3"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6">
                    <textarea
                      className="min-h-[420px] w-full rounded-lg border-2 border-input bg-muted/30 p-4 font-mono text-sm"
                      placeholder="CSV output will appear here..."
                      value={csvOutput}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Convert Button */}
              <div className="border-t bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6">
                <Button className="w-full" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Convert to CSV
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </>
  );
}