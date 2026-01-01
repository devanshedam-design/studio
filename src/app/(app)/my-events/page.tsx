'use client';
import { useAuth } from '@/contexts/auth-context';
import { mockDB } from '@/lib/data';
import type { ClubEvent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Ticket } from 'lucide-react';

const QrCodeComponent = ({ eventId, userId }: { eventId: string, userId: string }) => {
    const qrData = JSON.stringify({ eventId, userId });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    return <Image src={qrUrl} alt="QR Code" width={150} height={150} data-ai-hint="qr code" />;
}

export default function MyEventsPage() {
    const { user } = useAuth();

    if (!user) return null;

    const myRegistrations = mockDB.registrations.findByUser(user.id);
    const myEvents = myRegistrations
        .map(reg => mockDB.events.find(reg.eventId))
        .filter(Boolean) as ClubEvent[];

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">My Event Passes</h1>
            {myEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {myEvents.map(event => {
                         const club = mockDB.clubs.find(event.clubId);
                         return (
                            <Card key={event.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                               <div className="relative h-40 w-full">
                                    <Image src={event.bannerUrl} alt={event.name} fill className="object-cover" data-ai-hint="event banner"/>
                               </div>
                                <CardHeader>
                                    <CardTitle>{event.name}</CardTitle>
                                    <CardDescription>{club?.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-center items-center text-center gap-4">
                                   <div className="p-2 bg-white rounded-lg border">
                                     <QrCodeComponent eventId={event.id} userId={user.id} />
                                   </div>
                                    <div className="flex items-center gap-2 text-sm text-accent font-semibold p-2 rounded-md bg-accent/10">
                                      <Ticket className="h-4 w-4" />
                                      <span>Your Entry Pass</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <p>{new Date(event.date).toLocaleDateString()}</p>
                                        <p>{event.location}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Event Passes Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register for an event to get your entry pass.
                    </p>
                </div>
            )}
        </div>
    );
}
