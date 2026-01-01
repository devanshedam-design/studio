'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { EventFormSchema, type EventFormValues, type Club } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"


export default function CreateEventPage({ params }: { params: { clubId: string } }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const clubRef = useMemoFirebase(() => doc(firestore, 'clubs', params.clubId), [firestore, params.clubId]);
    const { data: club, isLoading: clubLoading } = useDoc<Club>(clubRef);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: {
            name: '',
            description: '',
            location: '',
        },
    });

    const onSubmit = async (values: EventFormValues) => {
        if (!user || !club) {
            toast({ variant: 'destructive', title: 'Authentication or club data missing' });
            return;
        }

        if (user.id !== club.adminId) {
             toast({ variant: 'destructive', title: 'Unauthorized', description: 'You are not the admin of this club.' });
            return;
        }

        try {
            const eventsCollection = collection(firestore, 'clubs', params.clubId, 'events');
            const bannerUrl = PlaceHolderImages.find(p => p.id === 'event-1')?.imageUrl || `https://picsum.photos/seed/${new Date().getTime()}/800/450`;
            
            const newEventData = {
                ...values,
                clubId: params.clubId,
                dateTime: Timestamp.fromDate(values.dateTime),
                bannerUrl,
            };

            const docRef = await addDoc(eventsCollection, newEventData);
            await updateDoc(docRef, { id: docRef.id });

            toast({
                title: 'Event Created!',
                description: `"${values.name}" has been scheduled.`,
            });
            router.push(`/admin/clubs/${params.clubId}`);

        } catch (error: any) {
            console.error("Error creating event: ", error);
            toast({
                variant: 'destructive',
                title: 'Error creating event',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    };
    
    if (clubLoading) {
        return <div>Loading club details...</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Create a New Event</CardTitle>
                    <CardDescription>Plan your next event for <span className="font-semibold text-primary">{club?.name}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g., Annual Tech Conference" {...field} />
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
                                        <FormLabel>Event Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="What's the event about? Who is it for?"
                                                className="resize-none"
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g., University Auditorium" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="dateTime"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date and Time</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                            format(field.value, "PPP")
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date()
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Event
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
