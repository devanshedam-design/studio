'use server';

/**
 * @fileOverview An AI agent for generating event reports.
 *
 * - generateEventReport - A function that generates an event report.
 * - GenerateEventReportInput - The input type for the generateEventReport function.
 * - GenerateEventReportOutput - The return type for the generateEventReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventReportInputSchema = z.object({
  eventId: z.string().describe('The ID of the event to generate a report for.'),
});
export type GenerateEventReportInput = z.infer<typeof GenerateEventReportInputSchema>;

const GenerateEventReportOutputSchema = z.object({
  report: z.string().describe('The generated event report.'),
});
export type GenerateEventReportOutput = z.infer<typeof GenerateEventReportOutputSchema>;

export async function generateEventReport(input: GenerateEventReportInput): Promise<GenerateEventReportOutput> {
  return generateEventReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventReportPrompt',
  input: {schema: GenerateEventReportInputSchema},
  output: {schema: GenerateEventReportOutputSchema},
  prompt: `You are an AI assistant that generates event reports based on event data.

  Given the event ID: {{{eventId}}}, generate a comprehensive report including:
  - Attendance summary
  - Engagement insights
  - Department/year-wise participation analysis
  - Key highlights and areas for improvement
  - Recommendations for future events
  
  Format the report in a readable and informative manner.
  `,
});

const generateEventReportFlow = ai.defineFlow(
  {
    name: 'generateEventReportFlow',
    inputSchema: GenerateEventReportInputSchema,
    outputSchema: GenerateEventReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
