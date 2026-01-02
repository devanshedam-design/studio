'use client';
import { useAuth } from '@/contexts/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import React from 'react';
import type { Club, ClubMembership } from '@/lib/types';
import Link from 'next/link';

const ProfileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  department: z.string().optional(),
  year: z.coerce.number().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

function JoinedClubsList({ userId }: { userId: string }) {
    const firestore = useFirestore();
    
    const membershipsQuery = useMemoFirebase(() => query(collection(firestore, 'clubMemberships'), where('userId', '==', userId)), [firestore, userId]);
    const { data: memberships, isLoading: loadingMemberships } = useCollection<ClubMembership>(membershipsQuery);

    const myClubIds = React.useMemo(() => memberships?.map(m => m.clubId) || [], [memberships]);

    const clubsQuery = useMemoFirebase(() => {
        if (myClubIds.length === 0) return null;
        return query(collection(firestore, 'clubs'), where('id', 'in', myClubIds));
    }, [firestore, myClubIds]);
    const { data: clubs, isLoading: loadingClubs } = useCollection<Club>(clubsQuery);

    if (loadingMemberships || loadingClubs) {
        return <p>Loading your clubs...</p>;
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle>My Clubs</CardTitle>
                <CardDescription>Clubs you are a member of.</CardDescription>
            </CardHeader>
            <CardContent>
                {clubs && clubs.length > 0 ? (
                    <div className="space-y-2">
                        {clubs.map(club => (
                            <Link href={`/clubs/${club.id}`} key={club.id} className="block">
                                <div className="p-3 rounded-md border hover:bg-secondary transition-colors">
                                    {club.name}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
                )}
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            department: '',
            year: undefined,
        },
    });

    React.useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                department: user.department || '',
                year: user.year || undefined,
            });
        }
    }, [user, form]);
    
    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated.' });
            return;
        }

        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                firstName: data.firstName,
                lastName: data.lastName,
                department: data.department,
                year: data.year,
            });
            toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        }
    };

    if (!user) {
        return <div>Loading profile...</div>;
    }
    
    const years = [1, 2, 3, 4];
    const departments = [
        "Computer Science and Engineering (CSE)",
        "CSE (Artificial Intelligence & Machine Learning)",
        "CSE (Cyber Security)",
        "CSE (Data Science)",
        "Information Technology (IT)",
        "Computer Science and Information Technology",
        "Aeronautical Engineering",
        "Electronics and Communication Engineering (ECE)",
        "Electrical and Electronics Engineering (EEE)",
        "Mechanical Engineering",
        "Civil Engineering",
    ];

    return (
        <div className="container mx-auto max-w-4xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">My Profile</CardTitle>
                    <CardDescription>View and edit your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select your department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="year"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year of Study</FormLabel>
                                        <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select your year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                             <Button type="submit" disabled={form.formState.isSubmitting} className="w-full md:w-auto">
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <JoinedClubsList userId={user.id} />
        </div>
    );
}
