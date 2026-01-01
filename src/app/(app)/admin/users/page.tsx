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
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AllUsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin' || user.email !== 'devanshedam@gmail.com')) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    if (authLoading || usersLoading || !user) {
        return <div className="flex h-64 items-center justify-center">Loading or unauthorized...</div>;
    }

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">User Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
