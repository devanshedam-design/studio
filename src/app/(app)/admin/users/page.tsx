'use client';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';
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
import { collection, query } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function AllUsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = React.useState('');

    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => 
            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

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
                    <CardTitle>All System Users</CardTitle>
                    <CardDescription>A list of all users in the system. Found {filteredUsers.length} users.</CardDescription>
                     <div className="pt-4">
                        <Input 
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading users...</TableCell></TableRow>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{u.firstName} {u.lastName}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell className="min-w-[200px]">{u.department || 'N/A'}</TableCell>
                                            <TableCell>{u.year || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No users found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
