import type { User, Club, ClubEvent, Announcement, Registration } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImageUrl = (id: string) => {
    return PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://placehold.co/600x400';
};

const usersList: User[] = [
  { id: 'user1', name: 'Alice Johnson', email: 'alice@example.com', avatarUrl: getImageUrl('user1-avatar'), role: 'student', year: 3, department: 'Computer Science', clubs: ['club1', 'club2'], adminOf: [] },
  { id: 'user2', name: 'Bob Williams', email: 'bob@example.com', avatarUrl: getImageUrl('user2-avatar'), role: 'admin', year: 4, department: 'Electrical Engineering', clubs: ['club1'], adminOf: ['club1'] },
  { id: 'user3', name: 'Charlie Brown', email: 'charlie@example.com', avatarUrl: getImageUrl('user3-avatar'), role: 'student', year: 2, department: 'Mechanical Engineering', clubs: ['club2'], adminOf: [] },
];

const clubsList: Club[] = [
  { id: 'club1', name: 'AI & Robotics Club', description: 'Exploring the frontiers of Artificial Intelligence and Robotics.', logoUrl: getImageUrl('club1-logo'), members: ['user1', 'user2'], admins: ['user2'] },
  { id: 'club2', name: 'Coding Hub', description: 'A community for passionate coders and developers.', logoUrl: getImageUrl('club2-logo'), members: ['user1', 'user3'], admins: [] },
];

const eventsList: ClubEvent[] = [
  { id: 'event1', clubId: 'club1', name: 'Intro to Machine Learning Workshop', description: 'A hands-on workshop covering the basics of ML with Python.', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), location: 'Tech Auditorium', bannerUrl: getImageUrl('event1-banner'), attendees: [] },
  { id: 'event2', clubId: 'club1', name: 'Annual Robotics Competition', description: 'Build and compete with your own robots.', date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), location: 'Main Quad', bannerUrl: getImageUrl('event2-banner'), attendees: ['user1'] },
  { id: 'event3', clubId: 'club2', name: 'Hackathon Prep Session', description: 'Get ready for the upcoming inter-college hackathon.', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), location: 'CS Department, Room 101', bannerUrl: getImageUrl('event3-banner'), attendees: ['user1'] },
  { id: 'event4', clubId: 'club1', name: 'Past AI Seminar', description: 'A seminar on recent advancements in AI.', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), location: 'Virtual', bannerUrl: getImageUrl('event4-banner'), attendees: ['user1', 'user2'], report: 'This was a highly successful seminar with over 50 attendees from various departments. The Q&A session was particularly engaging, showing high interest in practical AI applications. We recommend hosting a follow-up hands-on session on deep learning frameworks.' },
];

const announcementsList: Announcement[] = [
  { id: 'ann1', clubId: 'club1', title: 'Membership Drive 2024', content: 'We are now accepting new members! Sign up using the link on our page.', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'ann2', clubId: 'club2', title: 'Next Meeting Schedule', content: 'Our next weekly meeting will be this Friday at 5 PM in the library discussion room.', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

const registrationsList: Registration[] = [
  { userId: 'user1', eventId: 'event2', registeredAt: new Date().toISOString() },
  { userId: 'user1', eventId: 'event3', registeredAt: new Date().toISOString() },
];


// Simulate DB functions
export const mockDB = {
  users: {
    find: (id: string): User | undefined => usersList.find(u => u.id === id),
    findByEmail: (email: string): User | undefined => usersList.find(u => u.email === email),
    all: (): User[] => usersList,
  },
  clubs: {
    find: (id: string): Club | undefined => clubsList.find(c => c.id === id),
    all: (): Club[] => clubsList,
  },
  events: {
    find: (id: string): ClubEvent | undefined => eventsList.find(e => e.id === id),
    findByClub: (clubId: string): ClubEvent[] => eventsList.filter(e => e.clubId === clubId),
    all: (): ClubEvent[] => eventsList,
  },
  announcements: {
    findByClub: (clubId: string): Announcement[] => announcementsList.filter(a => a.clubId === clubId),
  },
  registrations: {
    findByUser: (userId: string): Registration[] => registrationsList.filter(r => r.userId === userId),
    isRegistered: (userId: string, eventId: string): boolean => !!registrationsList.find(r => r.userId === userId && r.eventId === eventId),
    register: (userId: string, eventId: string): Registration => {
      if (!mockDB.registrations.isRegistered(userId, eventId)) {
        const newRegistration = { userId, eventId, registeredAt: new Date().toISOString() };
        registrationsList.push(newRegistration);
        const event = mockDB.events.find(eventId);
        if (event) {
          event.attendees.push(userId);
        }
        return newRegistration;
      }
      return registrationsList.find(r => r.userId === userId && r.eventId === eventId)!;
    }
  }
};
