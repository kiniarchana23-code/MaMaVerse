'use client';
/**
 * Auth Context — provides user state, profile, and admin status to all components.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, onAuthStateChanged, getIsAdmin, User } from '@/lib/firebase';
import { profileApi, authApi } from '@/lib/api';

interface UserProfile {
  uid: string;
  email?: string;
  user_type?: 'pregnant' | 'new_mom';
  pregnancy_week?: number;
  trimester?: string;
  baby_age_months?: number;
  city?: string;
  is_subscribed?: boolean;
  dietary_preference?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isGuest: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  isGuest: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await profileApi.get();
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const adminStatus = await getIsAdmin();
        setIsAdmin(adminStatus);
        await refreshProfile();
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [refreshProfile]);

  const isGuest = user?.isAnonymous ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, isLoading, isGuest, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
