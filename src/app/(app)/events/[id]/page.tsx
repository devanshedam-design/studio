'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, CheckCircle, Ticket, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, Timestamp, getDocs, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import type { ClubEvent, Club, Registration } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventDetailPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isRegistered, setIsRegistered] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [event, setEvent] = useState<ClubEvent | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);

    // This query is inefficient. It scans all clubs for the event.
    // A better approach would be a top-level `events` collection if this query is frequent.
    // For now, we will query all `events` subcollections.
    useEffect(() => {
        const findEvent = async () => {
            setLoadingEvent(true);
            const clubsSnapshot = await getDocs(collection(firestore, 'clubs'));
            for (const clubDoc of clubsSnapshot.docs) {
                const eventRef = doc(firestore, 'clubs', clubDoc.id, 'events', params.id);
                const eventSnap = await getDoc(eventRef);
                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() } as ClubEvent);
                    break;
                }
            }
            setLoadingEvent(false);
        }
        findEvent();
    }, [firestore, params.id]);
    
    const clubRef = useMemoFirebase(() => event ? doc(firestore, 'clubs', event.clubId) : null, [firestore, event]);
    const { data: club, isLoading: loadingClub } = useDoc<Club>(clubRef);

    const registrationsQuery = useMemoFirebase(() => {
        if (!user || !event) return null;
        return query(collection(firestore, 'users', user.id, 'registrations'), where('eventId', '==', event.id));
    }, [firestore, user, event]);
    const { data: registrations, isLoading: loadingRegistrations } = useCollection<Registration>(registrationsQuery);

    // This is not scalable as it queries all users' registrations
    // A better approach would be a top-level collection of registrations grouped by eventId
    const attendeesQuery = useMemoFirebase(() => {
        if (!event) return null;
        // This is a placeholder query that does nothing useful, just to avoid errors.
        // A real implementation would query a different collection.
        return query(collection(firestore, 'registrations'), where('eventId', '==', event.id));
    }, [firestore, event]);
    const { data: attendees } = useCollection(attendeesQuery);


    useEffect(() => {
        setIsClient(true);
        if (registrations) {
            setIsRegistered(registrations.length > 0);
        }
    }, [registrations]);

    const handleRegister = async () => {
        if (user && event) {
            const newRegistrationData = {
                userId: user.id,
                eventId: event.id,
                registrationDate: Timestamp.now(),
                qrCode: `user:${user.id},event:${event.id}`
            };
            const registrationsCol = collection(firestore, 'users', user.id, 'registrations');
            const docRef = await addDoc(registrationsCol, newRegistrationData);
            await updateDoc(docRef, {id: docRef.id});

            setIsRegistered(true);
            toast({
                title: 'Registration Successful!',
                description: `You're all set for ${event.name}.`,
            });
        }
    };
    
    if (loadingEvent || loadingClub || loadingRegistrations || !isClient) {
        return (
            <div className="container mx-auto max-w-4xl">
                 <Card className="overflow-hidden">
                    <Skeleton className="h-60 w-full" />
                    <CardHeader className="relative -mt-16 z-10 p-4 md:p-6">
                        <Skeleton className="h-9 w-3/4" />
                        <Skeleton className="h-5 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-6">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                        <div className="space-y-2">
                             <Skeleton className="h-6 w-1/3" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-2/3" />
                        </div>
                         <div className="pt-4 border-t">
                            <Skeleton className="h-12 w-40" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!event || !club) {
        return <div className="text-center py-20">Event not found. It might have been moved or deleted.</div>;
    }

    const isEventPast = event.dateTime.toDate() < new Date();

    return (
        <div className="container mx-auto max-w-4xl">
            <Card className="overflow-hidden">
                <div className="relative h-60 w-full">
                    <Image
                        src={event.bannerUrl}
                        alt={`${event.name} banner`}
                        fill
                        className="object-cover"
                        data-ai-hint="event banner"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                <CardHeader className="relative -mt-20 z-10 p-4 md:p-6">
                    <CardTitle className="text-4xl font-bold text-white drop-shadow-lg">{event.name}</CardTitle>
                    <Link href={`/clubs/${club.id}`} className="text-primary-foreground/90 hover:text-white transition-colors text-lg">{club.name}</Link>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-8">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/70">
                            <Calendar className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-semibold">Date & Time</p>
                                <p className="text-muted-foreground">{event.dateTime.toDate().toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/70">
                            <MapPin className="h-6 w-6 text-primary" />
                             <div>
                                <p className="font-semibold">Location</p>
                                <p className="text-muted-foreground">{event.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/70">
                            <Users className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-semibold">Attendees</p>
                                <p className="text-muted-foreground">{attendees ? attendees.length : '0'}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-xl mb-2">About this event</h3>
                        <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                    </div>

                    <div className="pt-6 border-t-2 border-dashed">
                        {isRegistered ? (
                             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center p-6 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200">
                                 <CheckCircle className="h-10 w-10" />
                                 <div>
                                     <h3 className="font-bold text-xl">You are registered!</h3>
                                     <p className="text-sm mt-1">Your entry pass is available on the 'My Events' page.</p>
                                     <Link href="/my-events">
                                        <Button variant="link" className="text-green-800 dark:text-green-200 h-auto p-0 mt-2 text-base">View my pass <Ticket className="h-4 w-4 ml-2" /></Button>
                                     </Link>
                                 </div>
                             </div>
                        ) : (
                            <Button onClick={handleRegister} size="lg" className="w-full md:w-auto text-lg" disabled={isEventPast}>
                                {isEventPast ? "Event has passed" : "Register Now"}
                            </Button>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
