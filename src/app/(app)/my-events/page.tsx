'use client';
import { useAuth } from '@/contexts/auth-context';
import type { ClubEvent, Registration, Club } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Ticket, Calendar, MapPin } from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

const QrCodeComponent = ({ eventId, userId }: { eventId: string, userId: string }) => {
    const qrData = JSON.stringify({ eventId, userId });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    return <Image src={qrUrl} alt="QR Code" width={150} height={150} className="rounded-lg" data-ai-hint="qr code" />;
}

function EventPassCard({ event, userId }: { event: ClubEvent, userId: string }) {
    const firestore = useFirestore();
    const clubRef = useMemoFirebase(() => doc(firestore, 'clubs', event.clubId), [firestore, event.clubId]);
    const { data: club, isLoading } = useDoc<Club>(clubRef);

    if (isLoading) {
        return <Card className="flex flex-col overflow-hidden"><CardContent><p>Loading...</p></CardContent></Card>
    }

    return (
        <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl border-l-4 border-primary">
           <div className="relative h-40 w-full bg-secondary">
                <Image src={event.bannerUrl} alt={event.name} fill className="object-cover" data-ai-hint="event banner"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-4 flex flex-col justify-end">
                    <CardTitle className="text-white text-2xl font-bold">{event.name}</CardTitle>
                    <CardDescription className="text-white/90">{club?.name}</CardDescription>
                </div>
           </div>
            <CardContent className="flex-grow flex flex-col justify-center items-center text-center gap-4 p-6">
               <div className="p-2 bg-white rounded-xl border-4 border-muted">
                 <QrCodeComponent eventId={event.id} userId={userId} />
               </div>
                <div className="flex items-center gap-2 text-base text-accent font-semibold p-2 rounded-md bg-accent/10">
                  <Ticket className="h-5 w-5" />
                  <span>Your Official Entry Pass</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {event.dateTime.toDate().toLocaleDateString()}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {event.location}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyEventsPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const registrationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.id, 'registrations'));
    }, [firestore, user]);
    const { data: registrations, isLoading: loadingRegistrations } = useCollection<Registration>(registrationsQuery);

    const eventIds = useMemoFirebase(() => registrations?.map(r => r.eventId) || [], [registrations]);
    
    // This query is not efficient as it queries all events. 
    // It should query a top-level events collection.
    const eventsQuery = useMemoFirebase(() => {
        if (eventIds.length === 0) return null;
        return query(collection(firestore, 'events'), where('id', 'in', eventIds));
    }, [firestore, eventIds]);
    const { data: myEvents, isLoading: loadingEvents } = useCollection<ClubEvent>(eventsQuery);


    if (loadingRegistrations || loadingEvents) {
        return <div>Loading your events...</div>
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">My Event Passes</h1>
            {myEvents && myEvents.length > 0 && user ? (
                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {myEvents.map(event => (
                        <EventPassCard key={event.id} event={event} userId={user.id} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                    <Ticket className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-6 text-xl font-medium">No Event Passes Yet</h3>
                    <p className="mt-2 text-base text-muted-foreground">
                        Register for an event to get your entry pass.
                    </p>
                </div>
            )}
        </div>
    );
}
