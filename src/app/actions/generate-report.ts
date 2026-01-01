'use server';

import { generateEventReport } from '@/ai/flows/generate-event-report';
import { mockDB } from '@/lib/data';

export async function generateReportAction(eventId: string) {
    try {
        const event = mockDB.events.find(eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const aiInput = {
            eventId: event.id,
        };

        const result = await generateEventReport(aiInput);

        // In a real app, you'd save this to your database.
        // For this mock, we'll just update the in-memory object.
        event.report = result.report;

        return { success: true, report: result.report };
    } catch (error) {
        console.error('Error generating report:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to generate report: ${errorMessage}` };
    }
}
