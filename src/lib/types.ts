export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'student' | 'admin';
  year?: number;
  department?: string;
  clubs: string[]; // array of club IDs
  adminOf: string[]; // array of club IDs if admin
};

export type Club = {
  id: string;
  name:string;
  description: string;
  logoUrl: string;
  members: string[]; // array of user IDs
  admins: string[]; // array of user IDs
};

export type ClubEvent = {
  id: string;
  clubId: string;
  name: string;
  description: string;
  date: string; // ISO string
  location: string;
  bannerUrl: string;
  attendees: string[]; // array of user IDs
  report?: string;
};

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
};

export type Registration = {
  userId: string;
  eventId: string;
  registeredAt: string; // ISO string
};
