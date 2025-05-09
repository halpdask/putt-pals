
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getProfile, createProfile } from '../lib/supabase';
import { GolferProfile } from '../types/golfer';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: GolferProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<GolferProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!userId) return null;
    
    const userProfile = await getProfile(userId);
    setProfile(userProfile);
    return userProfile;
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get session from Supabase auth
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error setting up auth:", error);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    setData();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Define login function
  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Define signup function with profile creation
  async function signUp(email: string, password: string) {
    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      
      // Create a basic profile for the user if signup was successful
      if (!error && data?.user) {
        const defaultProfile: GolferProfile = {
          id: data.user.id,
          name: email.split('@')[0] || 'Golfare',
          age: 30,
          gender: 'Man',
          handicap: 18,
          homeCourse: '',
          location: '',
          bio: '',
          profileImage: '',
          roundTypes: ['Sällskapsrunda'],
          availability: ['Helger'],
        };
        
        await createProfile(defaultProfile);
      }
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Define logout function
  async function signOut() {
    setProfile(null);
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  // Use the provider to make auth object available throughout app
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Create a custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
