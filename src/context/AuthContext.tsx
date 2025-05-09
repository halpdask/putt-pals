
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getProfile, createProfile } from '../lib/supabase';
import { GolferProfile, RoundType } from '../types/golfer';
import { toast } from '@/hooks/use-toast';

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
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchProfile = async (userId: string) => {
    if (!userId) return null;
    
    try {
      console.log("Fetching profile for user ID:", userId);
      const userProfile = await getProfile(userId);
      console.log("Fetched profile result:", userProfile);
      
      if (userProfile) {
        setProfile(userProfile);
        return userProfile;
      } else {
        console.warn("No profile found for user ID:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log("Refreshing profile for user:", user.id);
      await fetchProfile(user.id);
    } else {
      console.warn("Cannot refresh profile - no user ID available");
    }
  };

  // Handle recovery from connection issues
  const recoverSession = async () => {
    try {
      console.log("Attempting to recover session...");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Failed to recover session:", error);
        return false;
      }
      
      if (session) {
        console.log("Session recovered successfully:", session.user.id);
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
        return true;
      } else {
        console.log("No session to recover");
        return false;
      }
    } catch (error) {
      console.error("Unexpected error recovering session:", error);
      return false;
    }
  };

  useEffect(() => {
    // Get session from Supabase auth
    const setData = async () => {
      try {
        console.log("Initializing auth context...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        setSession(session);
        
        if (session?.user) {
          console.log("Found existing session for user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No active session found");
        }
        
        setLoading(false);
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error setting up auth:", error);
        setLoading(false);
        setAuthInitialized(true);
        
        // Try to recover
        window.setTimeout(() => {
          recoverSession();
        }, 1000);
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

    // Add window focus event listener to check session when tab becomes active
    const handleFocus = () => {
      if (authInitialized) {
        console.log("Window focused, checking auth state");
        recoverSession();
      }
    };

    window.addEventListener('focus', handleFocus);

    // Add online status event listeners
    const handleOnline = () => {
      console.log("Browser is online, attempting to reconnect");
      if (authInitialized) {
        recoverSession();
      }
    };

    window.addEventListener('online', handleOnline);

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [authInitialized]);

  // Define login function
  async function signIn(email: string, password: string) {
    try {
      console.log("Attempting sign in for user:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Inloggningen misslyckades",
          description: error.message || "Kontrollera dina inloggningsuppgifter och försök igen.",
          variant: "destructive",
        });
      } else {
        console.log("Sign in successful");
      }
      
      return { error };
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte logga in. Försök igen senare.",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  }

  // Define signup function with profile creation
  async function signUp(email: string, password: string) {
    try {
      console.log("Attempting sign up for user:", email);
      const { error, data } = await supabase.auth.signUp({ email, password });
      
      // Create a basic profile for the user if signup was successful
      if (!error && data?.user) {
        try {
          console.log("Sign up successful, creating profile for user:", data.user.id);
          
          // Adjust the profile structure to match your actual database schema
          const defaultProfile: Partial<GolferProfile> = {
            id: data.user.id,
            name: email.split('@')[0] || 'Golfare',
            age: 30,
            gender: 'Man' as const,
            handicap: 18,
            homeCourse: '',
            location: '',
            bio: '',
            profileImage: '',
            roundTypes: ['Sällskapsrunda'] as RoundType[],
            availability: ['Helger'],
          };
          
          console.log("Creating profile with:", defaultProfile);
          const createdProfile = await createProfile(defaultProfile);
          console.log("Created profile:", createdProfile);
          
          if (!createdProfile) {
            console.error("Failed to create profile during signup");
            toast({
              title: "Varning",
              description: "Konto skapat men din profil kunde inte skapas. Försök uppdatera din profil senare.",
              variant: "destructive",
            });
          }
        } catch (profileError) {
          console.error("Profile creation error during signup:", profileError);
          toast({
            title: "Varning",
            description: "Konto skapat men din profil kunde inte skapas. Försök uppdatera din profil senare.",
            variant: "destructive",
          });
        }
      } else if (error) {
        console.error("Signup error:", error);
        toast({
          title: "Registreringen misslyckades",
          description: error.message || "Ett fel inträffade vid registreringen.",
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte skapa konto. Försök igen senare.",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  }

  // Define logout function
  async function signOut() {
    try {
      console.log("Signing out current user");
      setProfile(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Ett fel inträffade",
          description: "Kunde inte logga ut. Försök igen senare.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte logga ut. Försök igen senare.",
        variant: "destructive",
      });
    }
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
