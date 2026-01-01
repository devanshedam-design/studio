'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Shield,
  LifeBuoy
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
import { mockDB } from '@/lib/data';

const AppSidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const menuItems = [
    { href: '/dashboard', label: 'My Clubs', icon: Home },
    { href: '/my-events', label: 'My Events', icon: Calendar },
  ];

  const adminMenuItems = user.adminOf.map(clubId => {
    const club = mockDB.clubs.find(clubId);
    return {
      href: `/admin/clubs/${clubId}`,
      label: club ? `${club.name} Admin` : 'Admin Panel',
      icon: Shield,
    };
  });

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
              <Link href={item.href} passHref>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                  <>
                    <item.icon />
                    <span>{item.label}</span>
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {isAdmin && adminMenuItems.length > 0 && (
            <>
              <SidebarSeparator />
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <>
                        <item.icon />
                        <span>{item.label}</span>
                      </>
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
