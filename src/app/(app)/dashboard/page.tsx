'use client';
import { useAuth } from '@/contexts/auth-context';
import { mockDB } from '@/lib/data';
import type { Club } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, Megaphone, Users } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

    const myClubs = user.clubs.map(clubId => mockDB.clubs.find(clubId)).filter(Boolean) as Club[];

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">My Clubs</h1>
            {myClubs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {myClubs.map(club => {
                        const clubEvents = mockDB.events.findByClub(club.id);
                        const clubAnnouncements = mockDB.announcements.findByClub(club.id);
                        const isUserAdmin = club.admins.includes(user.id);

                        return (
                            <Card key={club.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4 bg-card-foreground/5">
                                    <Image
                                        src={club.logoUrl}
                                        alt={`${club.name} logo`}
                                        width={80}
                                        height={80}
                                        className="rounded-lg border"
                                        data-ai-hint="club logo"
                                    />
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-semibold text-primary">{club.name}</CardTitle>
                                        <CardDescription className="mt-1">{club.description}</CardDescription>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={isUserAdmin ? "destructive" : "secondary"}>
                                                {isUserAdmin ? 'Admin' : 'Member'}
                                            </Badge>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Users className="h-4 w-4 mr-1" />
                                                {club.members.length} members
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2 flex items-center"><Megaphone className="h-4 w-4 mr-2 text-accent"/>Recent Announcements</h3>
                                        {clubAnnouncements.length > 0 ? (
                                            <ul className="space-y-2">
                                                {clubAnnouncements.slice(0, 2).map(ann => (
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
                                        {clubEvents.filter(e => new Date(e.date) > new Date()).length > 0 ? (
                                            <ul className="space-y-2">
                                                {clubEvents.filter(e => new Date(e.date) > new Date()).slice(0, 2).map(event => (
                                                   <li key={event.id}>
                                                     <Link href={`/events/${event.id}`} className="block text-sm p-2 rounded-md hover:bg-secondary/50 transition-colors">
                                                        <p className="font-medium text-primary hover:underline">{event.name}</p>
                                                        <p className="text-muted-foreground text-xs">{new Date(event.date).toLocaleDateString()}</p>
                                                     </Link>
                                                   </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <p>You haven&apos;t joined any clubs yet.</p>
            )}
        </div>
    );
}
