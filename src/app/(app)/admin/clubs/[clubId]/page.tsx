'use client';
import { useAuth } from '@/contexts/auth-context';
import { mockDB } from '@/lib/data';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileText, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminClubPage({ params }: { params: { clubId: string } }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user && !user.adminOf.includes(params.clubId)) {
            router.push('/dashboard');
        }
    }, [user, loading, router, params.clubId]);

    const club = mockDB.clubs.find(params.clubId);
    const events = mockDB.events.findByClub(params.clubId);

    if (loading || !user || !club || !user.adminOf.includes(params.clubId)) {
        return <div className="flex h-64 items-center justify-center">Loading or unauthorized...</div>;
    }

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin: {club.name}</h1>
                    <p className="text-muted-foreground">Manage your club's events and reports.</p>
                </div>
                <Button disabled>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
            </div>
            
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
                                <TableHead>Attendees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map(event => {
                                const isPast = new Date(event.date) < new Date();
                                return (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.name}</TableCell>
                                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={isPast ? 'outline' : 'default'}>{isPast ? 'Past' : 'Upcoming'}</Badge>
                                    </TableCell>
                                    <TableCell>{event.attendees.length}</TableCell>
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
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
