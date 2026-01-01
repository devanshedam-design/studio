'use client';
import { useAuth } from '@/contexts/auth-context';
import type { Club, ClubEvent, ClubMembership, ClubWithMembership } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, PlusCircle, Building } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

function ClubCard({ club }: { club: ClubWithMembership }) {
    const firestore = useFirestore();

    const eventsQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'clubs', club.id, 'events'), where('dateTime', '>', new Date()));
    }, [firestore, club.id]);
    const { data: upcomingEvents } = useCollection<ClubEvent>(eventsQuery);

    const membersQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'clubMemberships'), where('clubId', '==', club.id));
    }, [firestore, club.id]);
    const { data: members } = useCollection<ClubMembership>(membersQuery);

    return (
        <Link href={`/clubs/${club.id}`} className="block">
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50 group h-full flex flex-col">
                <div className="relative h-40 w-full">
                    <Image
                        src={club.logoUrl}
                        alt={`${club.name} logo`}
                        fill
                        className="object-cover"
                        data-ai-hint="club logo"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute bottom-4 left-4">
                        <CardTitle className="text-xl font-bold text-white group-hover:text-accent transition-colors">{club.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            {club.isAdmin ? <Badge variant="destructive">Admin</Badge> : <Badge variant="secondary">Member</Badge>}
                        </div>
                     </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <CardDescription className="flex-grow">{club.description}</CardDescription>
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{members?.length || 0} Members</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{upcomingEvents?.length || 0} Upcoming Events</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
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
        isMember: true, 
        isAdmin: user?.adminOf.includes(club.id) || false
    })) || [];

    return (
        <div className="container mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">My Clubs</h1>
                    <p className="text-muted-foreground mt-1">The clubs you are a part of.</p>
                </div>
                <Link href="/clubs/create">
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create a Club
                    </Button>
                </Link>
            </div>
            {myClubs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {myClubs.map(club => (
                       <ClubCard key={club.id} club={club} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card flex flex-col items-center justify-center">
                    <Building className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-6 text-xl font-medium">No Clubs Joined Yet</h3>
                    <p className="mt-2 text-base text-muted-foreground">
                        Explore and join clubs to see them here.
                    </p>
                    <Link href="/clubs" className="mt-6">
                        <Button>
                           Explore Clubs
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
