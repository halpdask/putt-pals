
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
    
    try {
      const userProfile = await getProfile(userId);
      console.log("Fetched profile:", userProfile);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
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
          console.error("Auth session error:", error);
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
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
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
      if (error) {
        console.error("Sign in error:", error);
      }
      return { error };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      return { error: error as Error };
    }
  }

  // Define signup function with profile creation
  async function signUp(email: string, password: string) {
    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      
      // Create a basic profile for the user if signup was successful
      if (!error && data?.user) {
        try {
          // Adjust the profile structure to match your actual database schema
          const defaultProfile = {
            id: data.user.id,
            name: email.split('@')[0] || 'Golfare',
            age: 30,
            gender: 'Man' as const,
            handicap: 18,
            homeCourse: '',
            location: '',
            bio: '',
            profileImage: '', // Changed from profile_image to match GolferProfile type
            roundTypes: ['Sällskapsrunda'] as const,
            availability: ['Helger'],
          };
          
          console.log("Creating profile with:", defaultProfile);
          const createdProfile = await createProfile(defaultProfile);
          console.log("Created profile:", createdProfile);
          
          if (!createdProfile) {
            console.error("Failed to create profile during signup");
          }
        } catch (profileError) {
          console.error("Profile creation error during signup:", profileError);
        }
      } else if (error) {
        console.error("Signup error:", error);
      }
      
      return { error };
    } catch (error) {
      console.error("Unexpected signup error:", error);
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
