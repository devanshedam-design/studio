'use client';
import { useAuth } from '@/contexts/auth-context';
import type { Club, ClubMembership, ClubWithMembership } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Megaphone, Users, PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

function ClubCard({ club, announcements, events }: { club: ClubWithMembership, announcements: any[], events: any[] }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4 bg-card-foreground/5">
                {/* <Image
                    src={club.logoUrl}
                    alt={`${club.name} logo`}
                    width={80}
                    height={80}
                    className="rounded-lg border"
                    data-ai-hint="club logo"
                /> */}
                <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-primary">{club.name}</CardTitle>
                    <CardDescription className="mt-1">{club.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                        {club.isAdmin ? <Badge variant="destructive">Admin</Badge> : <Badge variant="secondary">Member</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center"><Megaphone className="h-4 w-4 mr-2 text-accent"/>Recent Announcements</h3>
                    {announcements.length > 0 ? (
                        <ul className="space-y-2">
                            {announcements.slice(0, 2).map(ann => (
                                <li key={ann.id} className="text-sm p-2 rounded-md bg-secondary/50">
                                    <p className="font-medium">{ann.title}</p>
                                    <p className="text-muted-foreground text-xs">{ann.content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No recent announcements.</p>}
                </div>
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center"><Calendar className="h-4 w-4 mr-2 text-accent" />Upcoming Events</h3>
                    {events.filter(e => e.dateTime.toDate() > new Date()).length > 0 ? (
                        <ul className="space-y-2">
                            {events.filter(e => e.dateTime.toDate() > new Date()).slice(0-2).map(event => (
                               <li key={event.id}>
                                 <Link href={`/events/${event.id}`} className="block text-sm p-2 rounded-md hover:bg-secondary/50 transition-colors">
                                    <p className="font-medium text-primary hover:underline">{event.name}</p>
                                    <p className="text-muted-foreground text-xs">{event.dateTime.toDate().toLocaleDateString()}</p>
                                 </Link>
                               </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const membershipsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'clubMemberships'), where('userId', '==', user.id));
    }, [firestore, user]);

    const { data: memberships, isLoading: loadingMemberships } = useCollection<ClubMembership>(membershipsQuery);
    
    const clubIds = useMemoFirebase(() => memberships?.map(m => m.clubId) || [], [memberships]);

    const clubsQuery = useMemoFirebase(() => {
        if (!clubIds || clubIds.length === 0) return null;
        return query(collection(firestore, 'clubs'), where('id', 'in', clubIds));
    }, [firestore, clubIds]);

    const { data: clubs, isLoading: loadingClubs } = useCollection<Club>(clubsQuery);

    if (loadingClubs || loadingMemberships) {
        return <div>Loading...</div>
    }

    const myClubs: ClubWithMembership[] = clubs?.map(club => ({
        ...club,
        isMember: true, // by definition of the query
        isAdmin: user?.adminOf.includes(club.id) || false
    })) || [];

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">My Clubs</h1>
                <Link href="/clubs/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Club
                    </Button>
                </Link>
            </div>
            {myClubs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {myClubs.map(club => {
                        // These would also be fetched from firestore in a real app
                        const clubEvents: any[] = [];
                        const clubAnnouncements: any[] = [];

                        return (
                           <ClubCard key={club.id} club={club} announcements={clubAnnouncements} events={clubEvents} />
                        )
                    })}
                </div>
            ) : (
                <p>You haven&apos;t joined any clubs yet.</p>
            )}
        </div>
    );
}
