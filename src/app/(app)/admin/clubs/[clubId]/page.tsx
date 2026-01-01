'use client';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileText, Edit, Trash2, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import type { Club, ClubEvent, ClubMembership, UserProfile } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function MembersTab({ clubId }: { clubId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');

    const membershipsQuery = useMemoFirebase(() => query(collection(firestore, 'clubMemberships'), where('clubId', '==', clubId)), [firestore, clubId]);
    const { data: memberships, isLoading: loadingMemberships, error } = useCollection<ClubMembership>(membershipsQuery);

    const memberIds = useMemo(() => memberships?.map(m => m.userId) || [], [memberships]);

    useEffect(() => {
        if (!loadingMemberships && memberIds.length > 0) {
            const usersQuery = query(collection(firestore, 'users'), where('id', 'in', memberIds));
            getDocs(usersQuery).then(userSnaps => {
                const userProfiles = userSnaps.docs.map(d => d.data() as UserProfile);
                setMembers(userProfiles);
                setIsLoading(false);
            });
        } else if (!loadingMemberships) {
            setMembers([]);
            setIsLoading(false);
        }
    }, [memberIds, loadingMemberships, firestore]);

    const handleAddMember = async () => {
        if (!email) return;
        setIsLoading(true);
        try {
            const userQuery = query(collection(firestore, 'users'), where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            if (userSnapshot.empty) {
                toast({ variant: 'destructive', title: 'User not found.' });
                return;
            }
            const userToAdd = userSnapshot.docs[0].data() as UserProfile;

            if (memberIds.includes(userToAdd.id)) {
                toast({ variant: 'destructive', title: 'User is already a member.' });
                return;
            }

            const newMembership: Omit<ClubMembership, 'id'> = {
                userId: userToAdd.id,
                clubId: clubId,
                joinDate: new Date() as any, // Timestamps are handled by Firestore
            };
            await addDoc(collection(firestore, 'clubMemberships'), newMembership);
            toast({ title: 'Member added!' });
            setEmail('');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error adding member' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemoveMember = async (userId: string) => {
        setIsLoading(true);
        try {
            const membershipQuery = query(collection(firestore, 'clubMemberships'), where('userId', '==', userId), where('clubId', '==', clubId));
            const membershipSnapshot = await getDocs(membershipQuery);
            if (!membershipSnapshot.empty) {
                const docToDelete = membershipSnapshot.docs[0];
                await deleteDoc(docToDelete.ref);
                toast({ title: 'Member removed.' });
            }
        } catch (e) {
             toast({ variant: 'destructive', title: 'Error removing member' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Club Members</CardTitle>
                <CardDescription>Add or remove members from your club.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input placeholder="Enter user's email to add" value={email} onChange={e => setEmail(e.target.value)} />
                    <Button onClick={handleAddMember} disabled={isLoading}><UserPlus className="mr-2"/> Add Member</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center">Loading members...</TableCell></TableRow>
                        ) : members.length > 0 ? (
                            members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)} disabled={isLoading}>
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={3} className="text-center">No members yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function AdminClubPage({ params }: { params: { clubId: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();

    const clubRef = useMemoFirebase(() => doc(firestore, 'clubs', params.clubId), [firestore, params.clubId]);
    const { data: club, isLoading: clubLoading } = useDoc<Club>(clubRef);
    
    const eventsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs', params.clubId, 'events')), [firestore, params.clubId]);
    const { data: events, isLoading: eventsLoading } = useCollection<ClubEvent>(eventsQuery);

    useEffect(() => {
        if (!authLoading && user && club && user.id !== club.adminId) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router, club]);


    if (authLoading || clubLoading || !user || !club) {
        return <div className="flex h-64 items-center justify-center">Loading or unauthorized...</div>;
    }

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin: {club.name}</h1>
                    <p className="text-muted-foreground">Manage your club's events and reports.</p>
                </div>
                <Link href={`/admin/clubs/${club.id}/events/create`}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                </Link>
            </div>
            
            <Tabs defaultValue="events">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>
                <TabsContent value="events">
                     <Card>
                        <CardHeader>
                            <CardTitle>Event Management</CardTitle>
                            <CardDescription>View, edit, and generate reports for your club's events.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Name</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eventsLoading ? (
                                         <TableRow><TableCell colSpan={4} className="text-center">Loading events...</TableCell></TableRow>
                                    ) : events && events.length > 0 ? (
                                        events.map(event => {
                                            const isPast = event.dateTime.toDate() < new Date();
                                            return (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">{event.name}</TableCell>
                                                <TableCell>{event.dateTime.toDate().toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isPast ? 'outline' : 'default'}>{isPast ? 'Past' : 'Upcoming'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {isPast && (
                                                            <Link href={`/admin/clubs/${club.id}/events/${event.id}/report`}>
                                                                <DropdownMenuItem>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    <span>{event.report ? 'View' : 'Generate'} Report</span>
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            )}
                                                            <DropdownMenuItem disabled>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                <span>Edit Event</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive" disabled>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Delete Event</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">No events created yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="members">
                    <MembersTab clubId={params.clubId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
