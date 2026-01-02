'use server';

import { generateEventReport } from '@/ai/flows/generate-event-report';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function generateReportAction(clubId: string, eventId: string) {
    try {
        const { firestore } = initializeFirebase();
        
        const eventRef = doc(firestore, 'clubs', clubId, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error('Event not found');
        }

        const eventData = eventSnap.data();

        // To get the number of attendees, we need to query the registrations.
        // This is inefficient but necessary with the current data model.
        let attendeeCount = 0;
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        for (const userDoc of usersSnapshot.docs) {
            const registrationQuery = query(
                collection(firestore, 'users', userDoc.id, 'registrations'),
                where('eventId', '==', eventId)
            );
            const registrationSnapshot = await getDocs(registrationQuery);
            attendeeCount += registrationSnapshot.size;
        }


        const aiInput = {
            eventName: eventData.name,
            eventDescription: eventData.description,
            attendeeCount: attendeeCount,
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
