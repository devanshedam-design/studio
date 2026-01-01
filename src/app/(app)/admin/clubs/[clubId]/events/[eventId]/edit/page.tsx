'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { EventFormSchema, type EventFormValues, type Club, type ClubEvent } from '@/lib/types';
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
import React from 'react';

export default function EditEventPage({ params }: { params: { clubId: string, eventId: string } }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const eventRef = useMemoFirebase(() => doc(firestore, 'clubs', params.clubId, 'events', params.eventId), [firestore, params.clubId, params.eventId]);
    const { data: event, isLoading: eventLoading } = useDoc<ClubEvent>(eventRef);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(EventFormSchema),
    });

    React.useEffect(() => {
        if (event) {
            form.reset({
                name: event.name,
                description: event.description,
                location: event.location,
                dateTime: event.dateTime.toDate(),
            });
        }
    }, [event, form]);

    const onSubmit = async (values: EventFormValues) => {
        if (!user || !event) {
            toast({ variant: 'destructive', title: 'Authentication or event data missing' });
            return;
        }

        try {
            const eventDocRef = doc(firestore, 'clubs', params.clubId, 'events', params.eventId);
            await updateDoc(eventDocRef, {
                ...values,
                dateTime: Timestamp.fromDate(values.dateTime),
            });

            toast({
                title: 'Event Updated!',
                description: `"${values.name}" has been successfully updated.`,
            });
            router.push(`/admin/clubs/${params.clubId}`);

        } catch (error: any) {
            console.error("Error updating event: ", error);
            toast({
                variant: 'destructive',
                title: 'Error updating event',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    };
    
    if (eventLoading) {
        return <div>Loading event details...</div>
    }
    
    if (!event) {
        return <div>Event not found.</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">Edit Event</CardTitle>
                    <CardDescription>Update the details for <span className="font-semibold text-primary">{event.name}</span>.</CardDescription>
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
                                            <Input {...field} />
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
                                            <Input {...field} />
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
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
