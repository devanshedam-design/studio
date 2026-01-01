'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ClubFormValues } from '@/lib/types';
import { ClubFormSchema } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function CreateClubPage() {
    const { user, firebaseUser } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<ClubFormValues>({
        resolver: zodResolver(ClubFormSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const onSubmit = async (values: ClubFormValues) => {
        if (!user || !firebaseUser) {
            toast({ variant: 'destructive', title: 'Not authenticated' });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            
            // 1. Create new Club with 'pending' status
            const newClubRef = doc(collection(firestore, 'clubs'));
            const clubId = newClubRef.id;
            const logoUrl = PlaceHolderImages.find(p => p.id === 'club-1')?.imageUrl || `https://picsum.photos/seed/${clubId}/600/400`;
            batch.set(newClubRef, {
                id: clubId,
                adminId: user.id,
                logoUrl,
                status: 'pending',
                ...values,
            });

            // 2. Update User's adminOf array - this gives them admin rights immediately
            const userRef = doc(firestore, 'users', user.id);
            const newAdminOf = [...user.adminOf, clubId];
            batch.update(userRef, { adminOf: newAdminOf });
            
            // User does not auto-join as a member until approved.
            // Admin can see the club in their admin list.

            await batch.commit();

            toast({
                title: 'Club Submitted for Approval!',
                description: `"${values.name}" is now pending review from an administrator.`,
            });
            router.push(`/dashboard`);

        } catch (error: any) {
            console.error("Error creating club: ", error);
            toast({
                variant: 'destructive',
                title: 'Error creating club',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    };

    return (
        <div className="container mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Propose a New Club</CardTitle>
                    <CardDescription>Fill out the form below to submit your club for admin approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Club Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g., The Coding Wizards" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Club Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us what your club is about..."
                                                className="resize-none"
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Approval
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
