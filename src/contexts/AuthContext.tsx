"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading && pathname !== '/login') {
     // Show a full-page loader only if not on the login page already and loading auth state
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // if on login page, render children immediately to show login form
  if (pathname === '/login' && (loading || !user)) {
    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
  }

  // if authenticated and not on login page, or finished loading and on a public page (if any)
  if ((user && pathname !=='/login') || (!loading && pathname ==='/login' && !user)) {
    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
  }

  // Default case if conditions above are not met, could be a loading state or redirect logic might handle it
  // For instance, if user is null and not on login page, the effect hook will redirect
  // If user exists and is on login page, the effect hook will redirect
  // This path ideally shouldn't be hit frequently if redirection logic is sound
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
