
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
  loading: boolean;
  loginCustomUser: (userDoc: UserDocument) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOM_USER_STORAGE_KEY = 'customUserData';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [customSessionUser, setCustomSessionUser] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Effect for Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      if (currentFirebaseUser) {
        // If Firebase auth becomes active (e.g., user signed in via other means or session restored)
        // clear any custom session.
        localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
        setCustomSessionUser(null);
      }
      setLoading(false); // Firebase auth state resolved
    });
    return () => unsubscribe();
  }, []);

  // Effect for loading custom user from localStorage (runs once on mount if no Firebase session is immediately active)
  useEffect(() => {
    // Only attempt to load custom user if Firebase hasn't already established a session during initial load phase
    if (!loading && !firebaseUser) {
      const storedCustomUserData = localStorage.getItem(CUSTOM_USER_STORAGE_KEY);
      if (storedCustomUserData) {
        try {
          setCustomSessionUser(JSON.parse(storedCustomUserData));
        } catch (e) {
          console.error("Failed to parse custom user data from localStorage:", e);
          localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
        }
      }
    }
  }, [loading, firebaseUser]); // Re-check if firebaseUser state changes or initial loading completes


  const loginCustomUser = (userDoc: UserDocument) => {
    localStorage.setItem(CUSTOM_USER_STORAGE_KEY, JSON.stringify(userDoc));
    setCustomSessionUser(userDoc);
    // If a Firebase session was active, signing out from it.
    // Custom login should take precedence.
    if (firebaseUser) {
      signOut(auth).catch(error => console.error("Error signing out Firebase user during custom login:", error));
      // onAuthStateChanged will set firebaseUser to null
    } else {
       setFirebaseUser(null); // Ensure firebaseUser is null if it wasn't already
    }
  };

  const logout = async () => {
    localStorage.removeItem(CUSTOM_USER_STORAGE_KEY);
    setCustomSessionUser(null);
    if (firebaseUser) {
      await signOut(auth); // This will trigger onAuthStateChanged, setting firebaseUser to null
    } else {
      setFirebaseUser(null); // Eagerly set firebaseUser to null if no active session
    }
    router.push('/login'); // Redirect to login after logout
  };

  const effectiveUser = firebaseUser || customSessionUser;
  const isAuthenticated = !!effectiveUser;

  // Redirection logic
  useEffect(() => {
    if (!loading) { // Only run redirects after initial auth state is determined
      const isAuthPage = pathname === '/login';
      if (!isAuthenticated && !isAuthPage) {
        router.push('/login');
      } else if (isAuthenticated && isAuthPage) {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, loading, router, pathname]);


  if (loading && pathname !== '/login' && !customSessionUser) {
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
