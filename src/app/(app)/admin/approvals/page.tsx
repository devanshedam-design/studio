'use client';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Club } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2 } from 'lucide-react';

export default function ApprovalsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [processingId, setProcessingId] = React.useState<string | null>(null);

    const pendingClubsQuery = useMemoFirebase(() => query(collection(firestore, 'clubs'), where('status', '==', 'pending')), [firestore]);
    const { data: pendingClubs, isLoading: clubsLoading } = useCollection<Club>(pendingClubsQuery);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin' || user.email !== 'devanshedam@gmail.com')) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleClubStatusChange = async (club: Club, newStatus: 'approved' | 'rejected') => {
        setProcessingId(club.id);
        try {
            const clubRef = doc(firestore, 'clubs', club.id);
            const batch = writeBatch(firestore);

            batch.update(clubRef, { status: newStatus });
            
            // If approving, also create the membership for the admin who created it.
            if (newStatus === 'approved') {
                const membershipRef = doc(collection(firestore, 'clubMemberships'));
                batch.set(membershipRef, {
                    id: membershipRef.id,
                    clubId: club.id,
                    userId: club.adminId,
                    joinDate: new Date(),
                });
            }
            
            await batch.commit();

            toast({
                title: `Club ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                description: `"${club.name}" has been ${newStatus}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error updating status',
                description: error.message || 'An unknown error occurred',
            });
        } finally {
            setProcessingId(null);
        }
    };
    
    if (authLoading || clubsLoading || !user) {
        return <div className="flex h-64 items-center justify-center">Loading or unauthorized...</div>;
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Club Approvals</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Pending Clubs</CardTitle>
                    <CardDescription>Review and approve or reject new club submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Club Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clubsLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading pending clubs...</TableCell></TableRow>
                            ) : pendingClubs && pendingClubs.length > 0 ? (
                                pendingClubs.map(club => (
                                    <TableRow key={club.id}>
                                        <TableCell className="font-medium">{club.name}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-sm truncate">{club.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{club.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleClubStatusChange(club, 'approved')}
                                                disabled={processingId === club.id}
                                            >
                                                {processingId === club.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                                            </Button>
                                             <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleClubStatusChange(club, 'rejected')}
                                                disabled={processingId === club.id}
                                             >
                                                 {processingId === club.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No pending club approvals.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
