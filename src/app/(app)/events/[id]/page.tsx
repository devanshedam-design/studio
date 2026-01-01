'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, CheckCircle, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import type { ClubEvent, Club, Registration } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function EventDetailPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isRegistered, setIsRegistered] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const eventRef = useMemoFirebase(() => doc(firestore, 'events', params.id), [firestore, params.id]);
    const { data: event, isLoading: loadingEvent } = useDoc<ClubEvent>(eventRef);
    
    const clubRef = useMemoFirebase(() => event ? doc(firestore, 'clubs', event.clubId) : null, [firestore, event]);
    const { data: club, isLoading: loadingClub } = useDoc<Club>(clubRef);

    const registrationsQuery = useMemoFirebase(() => {
        if (!user || !event) return null;
        return query(collection(firestore, 'registrations'), where('userId', '==', user.id), where('eventId', '==', event.id));
    }, [firestore, user, event]);
    const { data: registrations, isLoading: loadingRegistrations } = useCollection<Registration>(registrationsQuery);

    const attendeesQuery = useMemoFirebase(() => {
        if (!event) return null;
        return collection(firestore, 'registrations');
    }, [firestore, event]);
    const { data: attendees } = useCollection(query(attendeesQuery!, where('eventId', '==', params.id)));

    useEffect(() => {
        setIsClient(true);
        if (registrations) {
            setIsRegistered(registrations.length > 0);
        }
    }, [registrations]);

    if (loadingEvent || loadingClub || loadingRegistrations) {
        return <div>Loading...</div>;
    }

    if (!event || !club) {
        return <div>Event not found.</div>;
    }

    const handleRegister = async () => {
        if (user) {
            const newRegistration: Omit<Registration, 'id'> = {
                userId: user.id,
                eventId: event.id,
                registrationDate: Timestamp.now(),
                qrCode: `user:${user.id},event:${event.id}` // Simplified QR data
            };
            const registrationsCol = collection(firestore, 'users', user.id, 'registrations');
            await addDocumentNonBlocking(registrationsCol, newRegistration);
            setIsRegistered(true);
            toast({
                title: 'Registration Successful!',
                description: `You're all set for ${event.name}.`,
            });
        }
    };

    const isEventPast = event.dateTime.toDate() < new Date();

    return (
        <div className="container mx-auto max-w-4xl">
            <Card className="overflow-hidden">
                <div className="relative h-60 w-full">
                    {/* <Image
                        src={event.bannerUrl}
                        alt={`${event.name} banner`}
                        fill
                        className="object-cover"
                        data-ai-hint="event banner"
                    /> */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <CardHeader className="relative -mt-16 z-10 p-4 md:p-6">
                    <CardTitle className="text-3xl font-bold text-white drop-shadow-md">{event.name}</CardTitle>
                    <CardDescription className="text-primary-foreground/80">{club.name}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Date & Time</p>
                                <p>{event.dateTime.toDate().toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                            <MapPin className="h-5 w-5 text-primary" />
                             <div>
                                <p className="font-semibold">Location</p>
                                <p>{event.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Attendees</p>
                                <p>{attendees?.length || 0} registered</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">About this event</h3>
                        <p className="text-muted-foreground">{event.description}</p>
                    </div>

                    {isClient && (
                    <div className="pt-4 border-t">
                        {isRegistered ? (
                             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center p-4 rounded-lg bg-green-100 border border-green-300 text-green-800">
                                 <CheckCircle className="h-8 w-8" />
                                 <div>
                                     <h3 className="font-bold">You are registered!</h3>
                                     <p className="text-sm">Your entry pass is available on the 'My Events' page.</p>
                                     <Link href="/my-events">
                                        <Button variant="link" className="text-green-800 h-auto p-0 mt-1">View my pass <Ticket className="h-4 w-4 ml-2" /></Button>
                                     </Link>
                                 </div>
                             </div>
                        ) : (
                            <Button onClick={handleRegister} size="lg" className="w-full md:w-auto" disabled={isEventPast}>
                                {isEventPast ? "Event has passed" : "Register Now"}
                            </Button>
                        )}
                    </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
