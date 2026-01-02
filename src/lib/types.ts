'use client';

import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    department?: string;
    year?: number;
    role: 'student' | 'admin';
    adminOf: string[]; // List of clubIds
};

export type Club = {
  id: string;
  name:string;
  description: string;
  adminId: string;
  logoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type ClubWithMembership = Club & { isMember: boolean; isAdmin: boolean; };

export type ClubEvent = {
  id: string;
  clubId: string;
  name: string;
  description: string;
  dateTime: Timestamp;
  location: string;
  bannerUrl: string;
  report?: string;
};

export type Registration = {
  id: string;
  userId: string;
  eventId: string;
  registrationDate: Timestamp;
  qrCode: string;
};

export type ClubMembership = {
  id: string;
  userId: string;
  clubId: string;
  joinDate: Timestamp;
}

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
};

// Form schemas

export const ClubFormSchema = z.object({
  name: z.string().min(3, { message: "Club name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." })
});

export const EventFormSchema = z.object({
    name: z.string().min(3, { message: "Event name must be at least 3 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
    location: z.string().min(3, { message: "Location is required." }),
    dateTime: z.date({ required_error: "A date and time is required."}),
});

export const AnnouncementFormSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    content: z.string().min(10, { message: "Content must be at least 10 characters." }),
});

export type ClubFormValues = z.infer<typeof ClubFormSchema>;
export type EventFormValues = z.infer<typeof EventFormSchema>;
export type AnnouncementFormValues = z.infer<typeof AnnouncementFormSchema>;
