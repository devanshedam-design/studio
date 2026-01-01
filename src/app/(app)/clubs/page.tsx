'use client';

import type { Club, ClubMembership } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle, Building, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';

function ClubCard({ club, isMember }: { club: Club, isMember: boolean }) {
    const firestore = useFirestore();

    const membersQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'clubMemberships'), where('clubId', '==', club.id));
    }, [firestore, club.id]);
    const { data: members, isLoading: membersLoading } = useCollection<ClubMembership>(membersQuery);
    
    const eventsQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'clubs', club.id, 'events'), where('dateTime', '>', new Date()));
    }, [firestore, club.id]);
    const { data: upcomingEvents, isLoading: eventsLoading } = useCollection(eventsQuery);

    return (
        <Link href={`/clubs/${club.id}`} className="block h-full">
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
                </div>
                <CardHeader>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{club.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
                    <CardDescription className="flex-grow">{club.description}</CardDescription>
                     <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{members?.length ?? '...'} Members</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{upcomingEvents?.length ?? '...'} Events</span>
                            </div>
                        </div>
                         {isMember && (
                            <span className="text-xs font-semibold text-primary">Joined</span>
                         )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function ExploreClubsPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    const clubsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs'), where('status', '==', 'approved')), [firestore]);
    const { data: clubs, isLoading: loadingClubs } = useCollection<Club>(clubsQuery);

    const membershipsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'clubMemberships'), where('userId', '==', user.id));
    }, [firestore, user]);
    const { data: memberships, isLoading: loadingMemberships } = useCollection<ClubMembership>(membershipsQuery);

    const myClubIds = useMemo(() => memberships?.map(m => m.clubId) || [], [memberships]);


    if (loadingClubs || authLoading || loadingMemberships) {
        return (
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Explore IARE Clubs</h1>
                        <p className="text-muted-foreground mt-1">Discover student organizations and communities on campus.</p>
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="h-full flex flex-col">
                             <div className="h-40 w-full bg-muted animate-pulse"></div>
                             <CardHeader><div className="w-3/4 h-6 rounded bg-muted animate-pulse"></div></CardHeader>
                             <CardContent className="space-y-2 flex-grow flex flex-col justify-between">
                                <div>
                                    <div className="w-full h-4 rounded bg-muted animate-pulse"></div>
                                    <div className="w-2/3 h-4 rounded bg-muted animate-pulse mt-2"></div>
                                </div>
                                <div className="flex justify-between items-center mt-4 border-t pt-4">
                                     <div className="w-1/3 h-4 rounded bg-muted animate-pulse"></div>
                                     <div className="w-1/3 h-4 rounded bg-muted animate-pulse"></div>
                                </div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Explore IARE Clubs</h1>
                    <p className="text-muted-foreground mt-1">Discover student organizations and communities at our NAAC 'A++' Grade autonomous campus.</p>
                </div>
                <Link href="/clubs/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Start a Club
                    </Button>
                </Link>
            </div>
             {clubs && clubs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {clubs.map(club => (
                       <ClubCard 
                            key={club.id} 
                            club={club}
                            isMember={myClubIds.includes(club.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card flex flex-col items-center justify-center">
                    <Building className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-6 text-xl font-medium">No Approved Clubs Found</h3>
                    <p className="mt-2 text-base text-muted-foreground">
                       It looks like there are no approved clubs yet. Why not be the first to start one?
                    </p>
                    <Link href="/clubs/create" className="mt-6">
                        <Button>
                           <PlusCircle className="mr-2 h-4 w-4" />
                           Create a Club
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
