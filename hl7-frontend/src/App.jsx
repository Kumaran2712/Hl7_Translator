import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE_HL7 = `MSH|^~\\&|SendingApp|SendingFac|ReceivingApp|ReceivingFac|20231115103000||ADT^A01|MSG00001|P|2.5
EVN|A01|20231115103000
PID|1||12345^^^Hospital^MR||Doe^John^A||19800115|M|||123 Main St^^Springfield^IL^62701^USA||555-1234|555-5678||S||987654321|123-45-6789
PV1|1|I|ICU^101^01^Hospital^^^Bed^ICU||||1234^Smith^John^A^^^Dr|||SUR||||ADM|A0|`;

export default function App() {
  const [hl7Input, setHl7Input] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const analyzeHL7 = async () => {
    if (!hl7Input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter an HL7 message to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const res = await fetch("http://localhost:3000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hl7: hl7Input })
      });
    
      const data = await res.json();
    
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setResult(data.explanation);
      }
    
    } catch (error) {
      toast({
        title: "Server Error",
        description: "Unable to contact backend service.",
        variant: "destructive",
      });
    }
    
    setIsAnalyzing(false);
  };
    
  const loadExample = () => {
    setHl7Input(EXAMPLE_HL7);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">HL7 Translator</h1>
              <p className="text-sm text-muted-foreground">Healthcare messages in plain English</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Medical Data Translation
          </Badge>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Understand Your Healthcare Data
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste any HL7 message below and get an instant, easy-to-understand explanation
            of what it means.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                HL7 Message Input
              </CardTitle>
              <CardDescription>
                Paste your HL7 message here or try an example
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="MSH|^~\&|SendingApp|SendingFac..."
                value={hl7Input}
                onChange={(e) => setHl7Input(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={analyzeHL7}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Analyze Message
                    </>
                  )}
                </Button>
                <Button onClick={loadExample} variant="outline">
                  Load Example
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="shadow-lg bg-gradient-to-b from-card to-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Plain English Translation
              </CardTitle>
              <CardDescription>
                Easy-to-understand explanation of the HL7 message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-background/60 backdrop-blur-sm rounded-lg p-6 border">
                    {result.split('\n').map((line, idx) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <h3 key={idx} className="text-lg font-semibold text-foreground mt-4 mb-2 first:mt-0">
                            {line.replace(/\*\*/g, '')}
                          </h3>
                        );
                      } else if (line.startsWith('- **')) {
                        const parts = line.split(':**');
                        return (
                          <div key={idx} className="flex gap-2 mb-2">
                            <span className="text-primary font-medium">
                              {parts[0].replace('- **', '')}:
                            </span>
                            <span className="text-foreground">
                              {parts[1]?.trim()}
                            </span>
                          </div>
                        );
                      } else if (line.trim()) {
                        return (
                          <p key={idx} className="text-muted-foreground mb-3">
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">
                    Your analysis results will appear here
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Enter an HL7 message and click "Analyze Message"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Instant Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get immediate explanations of complex HL7 messages
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Plain English</h3>
                  <p className="text-sm text-muted-foreground">
                    Technical jargon translated into clear, simple language
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">All HL7 Types</h3>
                  <p className="text-sm text-muted-foreground">
                    Supports ADT, ORU, ORM, and other HL7 message types
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

