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
  eventName: z.string().describe('The name of the event.'),
  eventDescription: z.string().describe('The description of the event.'),
  attendeeCount: z.number().describe('The total number of attendees.'),
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
  prompt: `You are an AI assistant that generates event reports for a college club.

  Given the following information, generate a comprehensive report in a readable, well-formatted, and informative manner.
  
  Event Name: {{{eventName}}}
  Event Description: {{{eventDescription}}}
  Total Attendees: {{{attendeeCount}}}
  
  The report should include:
  - An engaging title.
  - A brief summary of the event's purpose.
  - An analysis of the attendance.
  - Potential insights into engagement (based on the description and attendance).
  - Recommendations for future similar events.
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
