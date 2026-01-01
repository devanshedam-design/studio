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
import { MoreHorizontal, PlusCircle, FileText, Edit, Trash2, UserPlus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import type { Club, ClubEvent, ClubMembership, UserProfile } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function MembersTab({ clubId }: { clubId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [members, setMembers] = useState<(UserProfile & { membershipId: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [email, setEmail] = useState('');

    const membershipsQuery = useMemoFirebase(() => query(collection(firestore, 'clubMemberships'), where('clubId', '==', clubId)), [firestore, clubId]);
    const { data: memberships, isLoading: loadingMemberships, error } = useCollection<ClubMembership>(membershipsQuery);

    const memberIds = useMemo(() => memberships?.map(m => m.userId) || [], [memberships]);

    useEffect(() => {
        if (!loadingMemberships && memberships && memberIds.length > 0) {
            const usersQuery = query(collection(firestore, 'users'), where('id', 'in', memberIds));
            getDocs(usersQuery).then(userSnaps => {
                const userProfiles = userSnaps.docs.map(d => d.data() as UserProfile);
                const membersWithId = userProfiles.map(u => {
                    const membership = memberships.find(m => m.userId === u.id);
                    return { ...u, membershipId: membership?.id || '' };
                });
                setMembers(membersWithId);
                setIsLoading(false);
            });
        } else if (!loadingMemberships) {
            setMembers([]);
            setIsLoading(false);
        }
    }, [memberIds, memberships, loadingMemberships, firestore]);

    const handleAddMember = async () => {
        if (!email) return;
        setIsAdding(true);
        try {
            const userQuery = query(collection(firestore, 'users'), where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            if (userSnapshot.empty) {
                toast({ variant: 'destructive', title: 'User not found.', description: `No user with email ${email} exists.` });
                setIsAdding(false);
                return;
            }
            const userToAdd = userSnapshot.docs[0].data() as UserProfile;

            if (memberIds.includes(userToAdd.id)) {
                toast({ variant: 'destructive', title: 'User is already a member.' });
                setIsAdding(false);
                return;
            }
            
            const batch = writeBatch(firestore);
            const newMembershipRef = doc(collection(firestore, 'clubMemberships'));
            batch.set(newMembershipRef, {
                id: newMembershipRef.id,
                userId: userToAdd.id,
                clubId: clubId,
                joinDate: serverTimestamp(),
            });

            await batch.commit();

            toast({ title: 'Member added!', description: `${userToAdd.firstName} has been added to the club.` });
            setEmail('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error adding member', description: e.message });
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleRemoveMember = async (membershipId: string, memberName: string) => {
        try {
            await deleteDoc(doc(firestore, 'clubMemberships', membershipId));
            toast({ title: 'Member removed.', description: `${memberName} has been removed from the club.` });
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Error removing member', description: e.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Club Members</CardTitle>
                <CardDescription>Add or remove members from your club. There are currently {members.length} members.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-6 pb-6 border-b">
                    <Input placeholder="Enter user's email to add..." value={email} onChange={e => setEmail(e.target.value)} />
                    <Button onClick={handleAddMember} disabled={isAdding}>
                        {isAdding ? <Loader2 className="mr-2 animate-spin"/> : <UserPlus className="mr-2"/>}
                         Add Member
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Loading members...</TableCell></TableRow>
                        ) : members.length > 0 ? (
                            members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.department || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove {member.firstName} from the club. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemoveMember(member.membershipId, `${member.firstName} ${member.lastName}`)}>
                                                        Remove
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow><TableCell colSpan={4} className="text-center h-24">No members yet. Add one above!</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function AdminClubPage({ params }: { params: { clubId: string } }) {
    const { clubId } = params;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const clubRef = useMemoFirebase(() => doc(firestore, 'clubs', clubId), [firestore, clubId]);
    const { data: club, isLoading: clubLoading } = useDoc<Club>(clubRef);
    
    const eventsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs', clubId, 'events')), [firestore, clubId]);
    const { data: events, isLoading: eventsLoading } = useCollection<ClubEvent>(eventsQuery);

    useEffect(() => {
        if (!authLoading && user && club && !user.adminOf.includes(club.id)) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router, club]);

    const handleDeleteEvent = async (eventId: string) => {
        try {
            await deleteDoc(doc(firestore, 'clubs', clubId, 'events', eventId));
            toast({ title: "Event Deleted", description: "The event has been successfully removed." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error deleting event", description: error.message });
        }
    };


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
            
            <Tabs defaultValue="events" className="w-full">
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
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eventsLoading ? (
                                         <TableRow><TableCell colSpan={5} className="text-center h-24">Loading events...</TableCell></TableRow>
                                    ) : events && events.length > 0 ? (
                                        events.map(event => {
                                            const isPast = event.dateTime.toDate() < new Date();
                                            return (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">{event.name}</TableCell>
                                                <TableCell>{event.dateTime.toDate().toLocaleDateString()}</TableCell>
                                                <TableCell>{event.location}</TableCell>
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
                                                            <Link href={`/admin/clubs/${club.id}/events/${event.id}/edit`}>
                                                                <DropdownMenuItem>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    <span>Edit Event</span>
                                                                </DropdownMenuItem>
                                                            </Link>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        <span>Delete Event</span>
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete the event and all of its associated data.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">No events created yet.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="members">
                    <MembersTab clubId={clubId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
