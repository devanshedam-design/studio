'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Shield,
  LifeBuoy,
  Users,
  Compass
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Club } from '@/lib/types';

const AppSidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const firestore = useFirestore();

  const adminClubsQuery = useMemoFirebase(() => {
    if (!user || !user.adminOf || user.adminOf.length === 0) return null;
    return query(collection(firestore, 'clubs'), where('id', 'in', user.adminOf));
  }, [firestore, user]);

  const { data: adminClubs, isLoading } = useCollection<Club>(adminClubsQuery);

  if (!user) return null;
  
  const isGlobalAdmin = user.role === 'admin' && user.email === 'devanshedam@gmail.com';

  const menuItems = [
    { href: '/dashboard', label: 'My Clubs', icon: Home },
    { href: '/clubs', label: 'Explore Clubs', icon: Compass },
    { href: '/my-events', label: 'My Events', icon: Calendar },
  ];
  
  const clubAdminItems = adminClubs?.map(club => {
    return {
      href: `/admin/clubs/${club.id}`,
      label: `${club.name} Admin`,
      icon: Shield,
    };
  }) || [];

  const globalAdminItems = isGlobalAdmin ? [
      { href: '/admin/users', label: 'User Management', icon: Users }
  ] : [];

  const adminMenuItems = [...clubAdminItems, ...globalAdminItems];


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
           <svg
              className="h-8 w-8 text-sidebar-foreground"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
          >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span className="text-lg font-semibold text-sidebar-foreground">ClubHive</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <div>
                        <item.icon />
                        <span>{item.label}</span>
                    </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {adminMenuItems.length > 0 && (
            <>
              <SidebarSeparator />
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                   <Link href={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <div>
                        <item.icon />
                        <span>{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Support">
              <LifeBuoy />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
