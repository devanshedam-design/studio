'use server';

import { generateEventReport } from '@/ai/flows/generate-event-report';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

export async function generateReportAction(eventId: string) {
    try {
        const { firestore } = initializeFirebase();
        let eventRef;
        let eventSnap;
        let clubId;

        // Inefficient, but necessary with current data model.
        const clubsSnapshot = await getDocs(collection(firestore, 'clubs'));
        for (const clubDoc of clubsSnapshot.docs) {
            const currentEventRef = doc(firestore, 'clubs', clubDoc.id, 'events', eventId);
            const currentEventSnap = await getDoc(currentEventRef);
            if (currentEventSnap.exists()) {
                eventRef = currentEventRef;
                eventSnap = currentEventSnap;
                clubId = clubDoc.id;
                break;
            }
        }
        
        if (!eventSnap || !eventRef || !eventSnap.exists()) {
            throw new Error('Event not found');
        }

        const aiInput = {
            eventId: eventId,
        };

        const result = await generateEventReport(aiInput);

        await updateDoc(eventRef, { report: result.report });

        return { success: true, report: result.report };
    } catch (error) {
        console.error('Error generating report:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, error: `Failed to generate report: ${errorMessage}` };
    }
}
