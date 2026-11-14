import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  role: UserRole;
  userName: string;
  userId: string;
  department: string;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_PROFILE_KEY = 'infrasync_cached_profile';
const CACHED_USER_KEY = 'infrasync_cached_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CACHED_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(CACHED_PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch or fallback profile from Supabase
  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Could not fetch profile from Supabase:', error.message);
      }

      const userRole: UserRole = (data?.role as UserRole) || 'field_worker';
      const userProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        fullName: data?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Field Operative',
        role: userRole,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at,
      };

      setProfile(userProfile);
      localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(userProfile));
    } catch (err) {
      console.error('[Auth] Error fetching profile:', err);
      const cached = localStorage.getItem(CACHED_PROFILE_KEY);
      if (cached) {
        setProfile(JSON.parse(cached));
      } else {
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          fullName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: 'field_worker',
        };
        setProfile(fallbackProfile);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(session.user));
        fetchProfile(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch((err) => {
      console.warn('[Auth] getSession error (likely offline):', err);
      if (mounted) setIsLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(currentSession.user);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(currentSession.user));
        await fetchProfile(currentSession.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_PROFILE_KEY);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
        await fetchProfile(data.user);
      }

      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      const needsEmailConfirmation = !data.session;

      if (data.user && data.session) {
        setUser(data.user);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
        await fetchProfile(data.user);
      }

      return { error: null, needsEmailConfirmation };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_PROFILE_KEY);
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const effectiveRole: UserRole = profile?.role || 'field_worker';
  const effectiveName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const effectiveId = user?.id ? user.id.substring(0, 8).toUpperCase() : 'ANON';
  const department =
    effectiveRole === 'admin'
      ? 'System Administration & Security'
      : effectiveRole === 'coordinator'
      ? 'Regional Infrastructure Coordination'
      : 'Field Operations Unit';

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      role: effectiveRole,
      userName: effectiveName,
      userId: effectiveId,
      department,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPasswordForEmail,
      updatePassword,
    }),
    [user, profile, session, effectiveRole, effectiveName, effectiveId, department, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
