'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateReportAction } from '@/app/actions/generate-report';
import { Bot, Download, Loader2 } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ClubEvent } from '@/lib/types';

export default function ReportPage({ params }: { params: { clubId: string, eventId: string } }) {
    const firestore = useFirestore();
    const eventRef = useMemoFirebase(() => doc(firestore, 'clubs', params.clubId, 'events', params.eventId), [firestore, params]);
    const { data: event, isLoading: eventLoading } = useDoc<ClubEvent>(eventRef);

    const [report, setReport] = useState<string | undefined>(event?.report);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    if (eventLoading) {
        return <div>Loading...</div>
    }

    if (!event) {
        return <div>Event not found</div>;
    }
     
    const handleGenerateReport = async () => {
        setIsLoading(true);
        const result = await generateReportAction(params.eventId);
        if (result.success && result.report) {
            setReport(result.report);
            toast({
                title: "Report Generated!",
                description: "The AI-powered event report has been successfully created."
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Error Generating Report",
                description: result.error || "An unknown error occurred."
            });
        }
        setIsLoading(false);
    };

    const handleDownloadReport = () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-report-${event.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">AI Event Report</CardTitle>
                    <CardDescription>For event: <span className="font-semibold text-primary">{event.name}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {report ? (
                        <div>
                            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-secondary/30 whitespace-pre-wrap font-mono text-sm">
                                {report}
                            </div>
                            <Button onClick={handleDownloadReport} className="mt-4">
                                <Download className="mr-2 h-4 w-4" />
                                Download Report
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                             <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                             <h3 className="mt-4 text-lg font-medium">No Report Generated Yet</h3>
                             <p className="mt-1 text-sm text-muted-foreground">
                                Generate an AI-powered report with attendance summaries and insights.
                            </p>
                            <Button onClick={handleGenerateReport} disabled={isLoading} className="mt-6">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Bot className="mr-2 h-4 w-4" />
                                        Generate with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
