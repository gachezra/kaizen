
"use client";

import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// import { signOut } from 'firebase/auth'; // signOut is now handled within useAuth().logout
// import { auth } from '@/lib/firebase/config'; // auth is used within AuthContext
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Image as ImageIcon, FileText, LogOut, UserCircle, PanelLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserDocument } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/gallery', label: 'Gallery Management', icon: ImageIcon },
  { href: '/admin/blog', label: 'Blog Management', icon: FileText },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user: effectiveUser, isAuthenticated, loading, logout } = useAuth(); // useAuth now provides effectiveUser and isAuthenticated
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Redirection logic is primarily handled by AuthContext now.
    // This effect can be simplified or removed if AuthContext covers all cases.
    if (!loading && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router, pathname]);

  const handleLogout = async () => {
    try {
      await logout(); // Call logout from AuthContext
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // router.push('/login'); // logout() in AuthContext handles redirection
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };
  
  // AuthProvider handles its own loading screen.
  // This check ensures we don't render admin layout if auth state is still resolving or user is not authenticated.
  if (loading || !isAuthenticated) {
     // If still loading or not authenticated, and not on login page, AuthContext should redirect.
     // If on login page, AuthContext will allow login page to render.
     // Returning null here avoids rendering admin layout prematurely.
    return null;
  }

  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  }

  const userEmail = effectiveUser?.email || "";
  const userName = (effectiveUser as FirebaseUser)?.displayName || (effectiveUser as UserDocument)?.name || "";
  const userPhotoURL = (effectiveUser as FirebaseUser)?.photoURL || undefined;


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              <span className="font-semibold text-lg text-foreground group-data-[collapsible=icon]:hidden">Kaizen CC</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                    className="justify-start"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto group-data-[collapsible=icon]:p-2">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden text-destructive">Logout</span>
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1">
            {/* Maybe breadcrumbs or page title here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userPhotoURL} alt={userName || userEmail || 'User'} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(userEmail, userName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{userName || userEmail}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

