'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';
import { mockDB } from '@/lib/data';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app with Firebase, you'd use onAuthStateChanged.
    // Since we are mocking, we'll just set loading to false after a short delay
    // to simulate checking auth state.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const signIn = (email: string) => {
    setLoading(true);
    const appUser = mockDB.users.findByEmail(email);
    if (appUser) {
      setUser(appUser);
      // Create a mock Firebase user object for consistency
      setFirebaseUser({ email: appUser.email } as FirebaseUser);
    }
    setLoading(false);
  };
  
  const signOut = () => {
    setUser(null);
    setFirebaseUser(null);
  };

  const value = { user, firebaseUser, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
