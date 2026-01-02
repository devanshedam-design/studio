'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, addDoc, getDocs, deleteDoc, serverTimestamp, updateDoc, writeBatch, orderBy } from 'firebase/firestore';
import type { Club, ClubEvent, ClubMembership, UserProfile, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Calendar, Users, UserPlus, LogOut, Loader2, Crown, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function AnnouncementList({ clubId }: { clubId: string }) {
    const firestore = useFirestore();
    const announcementsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs', clubId, 'announcements'), orderBy('createdAt', 'desc')), [firestore, clubId]);
    const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

    if (isLoading) return <p>Loading announcements...</p>;

    return (
        <div>
            <h3 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2"><Megaphone className="h-5 w-5"/>Announcements</h3>
            {announcements && announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-4 border rounded-lg bg-secondary/30">
                            <h4 className="font-bold">{ann.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{ann.createdAt.toDate().toLocaleString()}</p>
                            <p className="text-sm">{ann.content}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No announcements yet.</p>
            )}
        </div>
    )
}

function MemberList({ clubId }: { clubId: string }) {
    const firestore = useFirestore();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const membershipsQuery = useMemoFirebase(() => query(collection(firestore, 'clubMemberships'), where('clubId', '==', clubId)), [firestore, clubId]);
    const { data: memberships, isLoading: loadingMemberships } = useCollection<ClubMembership>(membershipsQuery);
    
    const memberIds = useMemo(() => memberships?.map(m => m.userId) || [], [memberships]);

    useEffect(() => {
        if (!loadingMemberships && memberIds.length > 0) {
            const usersQuery = query(collection(firestore, 'users'), where('id', 'in', memberIds));
            getDocs(usersQuery).then(userSnaps => {
                setMembers(userSnaps.docs.map(d => d.data() as UserProfile));
                setLoading(false);
            });
        } else if (!loadingMemberships) {
            setMembers([]);
            setLoading(false);
        }
    }, [memberIds, loadingMemberships, firestore]);

    if (loading) {
        return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="w-16 h-16 rounded-full bg-muted animate-pulse"></div>
                    <div className="w-24 h-4 rounded bg-muted animate-pulse"></div>
                </div>
            ))}
        </div>
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mt-8 mb-4">Members ({members.length})</h3>
            {members.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {members.map(member => (
                        <div key={member.id} className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-secondary/50">
                            <Avatar>
                                <AvatarFallback>{member.firstName[0]}{member.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium leading-tight">{member.firstName} {member.lastName}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No members yet.</p>
            )}
        </div>
    )
}

function EventList({ clubId }: { clubId: string }) {
    const firestore = useFirestore();
    const eventsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs', clubId, 'events'), where('dateTime', '>', new Date())), [firestore, clubId]);
    const { data: events, isLoading } = useCollection<ClubEvent>(eventsQuery);

    if (isLoading) return <p>Loading upcoming events...</p>

    return (
        <div>
            <h3 className="text-xl font-semibold mt-8 mb-4">Upcoming Events</h3>
            {events && events.length > 0 ? (
                 <div className="space-y-4">
                    {events.map(event => (
                        <Link key={event.id} href={`/events/${event.id}`}>
                            <div className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between">
                               <div>
                                    <p className="font-semibold">{event.name}</p>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                               </div>
                                <p className="text-sm text-muted-foreground">{event.dateTime.toDate().toLocaleDateString()}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No upcoming events scheduled.</p>
            )}
        </div>
    )
}


export default function ClubDetailPage({ params }: { params: { id: string } }) {
    const { id: clubId } = params;
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [isMember, setIsMember] = useState(false);
    const [membershipId, setMembershipId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const clubRef = useMemoFirebase(() => doc(firestore, 'clubs', clubId), [firestore, clubId]);
    const { data: club, isLoading: clubLoading } = useDoc<Club>(clubRef);

    const membershipQuery = useMemoFirebase(() => {
        if (!user || !club) return null;
        return query(collection(firestore, 'clubMemberships'), where('userId', '==', user.id), where('clubId', '==', club.id));
    }, [firestore, user, club]);
    const { data: memberships, isLoading: membershipLoading } = useCollection<ClubMembership>(membershipQuery);

    useEffect(() => {
        if (memberships && memberships.length > 0) {
            setIsMember(true);
            setMembershipId(memberships[0].id);
        } else {
            setIsMember(false);
            setMembershipId(null);
        }
    }, [memberships]);


    const handleJoinClub = async () => {
        if (!user || !club) return;
        setIsProcessing(true);
        try {
            const newMembershipRef = doc(collection(firestore, 'clubMemberships'));
            await writeBatch(firestore)
                .set(newMembershipRef, {
                    id: newMembershipRef.id,
                    userId: user.id,
                    clubId: club.id,
                    joinDate: serverTimestamp(),
                })
                .commit();

            toast({ title: "Welcome to the club!", description: `You've successfully joined ${club.name}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error joining club', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLeaveClub = async () => {
        if (!user || !club || !membershipId) return;
        setIsProcessing(true);
        try {
            await deleteDoc(doc(firestore, 'clubMemberships', membershipId));
            toast({ title: "You've left the club.", description: `You are no longer a member of ${club.name}.` });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error leaving club', description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    if (clubLoading || authLoading || membershipLoading) {
        return <div>Loading...</div>;
    }

    if (!club) {
        return <div>Club not found.</div>;
    }

    const isAdmin = user?.id === club.adminId;

    return (
        <div className="container mx-auto">
            <Card className="overflow-hidden">
                <div className="relative h-48 md:h-60 w-full">
                    <Image src={club.logoUrl} alt={`${club.name} banner`} fill className="object-cover" data-ai-hint="club banner"/>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <CardHeader className="relative -mt-12 md:-mt-16 z-10 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                        <div>
                             <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{club.name}</CardTitle>
                             <CardDescription className="text-primary-foreground/90 text-md md:text-lg">{club.description}</CardDescription>
                        </div>
                        <div className="mt-4 md:mt-0">
                           {isAdmin ? (
                               <Link href={`/admin/clubs/${club.id}`}>
                                <Button variant="secondary">
                                    <Crown className="mr-2 h-4 w-4" />
                                    Admin Dashboard
                                </Button>
                               </Link>
                           ) : isMember ? (
                                <Button variant="destructive" onClick={handleLeaveClub} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <LogOut className="mr-2"/>}
                                    Leave Club
                                </Button>
                            ) : (
                                <Button onClick={handleJoinClub} disabled={isProcessing}>
                                     {isProcessing ? <Loader2 className="mr-2 animate-spin"/> : <UserPlus className="mr-2"/>}
                                    Join Club
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    {isMember && <AnnouncementList clubId={club.id} />}
                    <EventList clubId={club.id} />
                    <MemberList clubId={club.id} />
                </CardContent>
            </Card>
        </div>
    );
}
