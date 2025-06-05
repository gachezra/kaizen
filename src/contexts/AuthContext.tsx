
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth'; // Keep Firebase User type
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { UserDocument } from '@/types'; // Import UserDocument

interface AuthContextType {
  user: User | UserDocument | null; // Effective user
  isAuthenticated: boolean;
  loading: boolean; // True if session state is still being resolved
  loginCustomUser: (userDoc: UserDocument) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOM_USER_STORAGE_KEY = 'customUserSessionData'; // Renamed for clarity

interface CustomSessionData {
  user: UserDocument;
  expiryTimestamp: number;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [customSessionUser, setCustomSessionUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true); // True until initial session status is resolved
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let customSessionResolved = false;
    let firebaseSessionResolved = false;

    const resolveSession = () => {
      if (customSessionResolved && firebaseSessionResolved) {
        setLoading(false);
      }
    };

    // Check for custom session from localStorage
    const storedCustomSession = localStorage.getItem(CUSTOM_USER_STORAGE_KEY);
    if (storedCustomSession) {
      try {
        const sessionData = JSON.parse(storedCustomSession) as CustomSessionData;
        if (Date.now() < sessionData.expiryTimestamp) {
          setCustomSessionUser(sessionData.user);
        } else {
          localStorage.removeItem(CUSTOM_USER_STORAGE_KEY); // Session expired
        }
      } catch (e) {
        console.error("Failed to parse custom user session data:", e);
        localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
      }
    }
    customSessionResolved = true;
    resolveSession();

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      if (currentFirebaseUser) {
        // If Firebase user becomes active, it takes precedence. Clear custom session.
        localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
        setCustomSessionUser(null);
      }
      firebaseSessionResolved = true;
      resolveSession();
    });

    return () => unsubscribe();
  }, []);


  const loginCustomUser = (userDoc: UserDocument) => {
    const expiryTimestamp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionData: CustomSessionData = { user: userDoc, expiryTimestamp };
    localStorage.setItem(CUSTOM_USER_STORAGE_KEY, JSON.stringify(sessionData));
    setCustomSessionUser(userDoc);

    if (firebaseUser) {
      signOut(auth).catch(error => console.error("Error signing out Firebase user during custom login:", error));
      setFirebaseUser(null); // Eagerly set to null
    }
  };

  const logout = async () => {
    localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
    setCustomSessionUser(null);
    if (firebaseUser) {
      await signOut(auth); // This will trigger onAuthStateChanged, setting firebaseUser to null
    } else {
      setFirebaseUser(null); 
    }
    // No direct router.push here; redirection useEffect will handle it
    // To ensure redirection logic re-evaluates promptly after logout:
    // We can setLoading(true) briefly, but better to rely on isAuthenticated changing.
  };

  const effectiveUser = firebaseUser || customSessionUser;
  const isAuthenticated = !!effectiveUser;

  // Redirection logic
  useEffect(() => {
    if (loading) return; // Wait until session status is fully resolved

    const isAuthPage = pathname === '/login';
    if (!isAuthenticated && !isAuthPage) {
      router.push('/login');
    } else if (isAuthenticated && isAuthPage) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, loading, router, pathname]);


  if (loading && pathname !== '/login') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: effectiveUser, isAuthenticated, loading, loginCustomUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
