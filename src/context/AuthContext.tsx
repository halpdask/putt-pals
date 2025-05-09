
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getProfile, createProfile, testConnection } from '../lib/supabase';
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
  connectionOk: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<GolferProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionOk, setConnectionOk] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Check connection status
  const checkConnection = async () => {
    try {
      const { ok } = await testConnection();
      setConnectionOk(ok);
      return ok;
    } catch (error) {
      console.error("Connection check failed:", error);
      setConnectionOk(false);
      return false;
    }
  };

  // Handle recovery from connection issues with exponential backoff
  const recoverSession = async () => {
    try {
      // First check connection status
      const connectionOk = await checkConnection();
      if (!connectionOk) {
        console.warn("Connection to Supabase is down, will retry later");
        if (reconnectAttempts < 5) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            recoverSession();
          }, Math.min(1000 * (2 ** reconnectAttempts), 30000));
        }
        return false;
      }

      console.log(`Attempting to recover session (attempt ${reconnectAttempts + 1})...`);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Failed to recover session:", error);
        
        // Clear stored token if it's invalid
        if (error.message?.includes('JWT')) {
          console.log("Clearing invalid auth token");
          localStorage.removeItem("supabase.auth.token");
        }
        
        // Increment reconnect attempts and try again with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * (2 ** reconnectAttempts), 30000); // Max 30 seconds
          console.log(`Will retry in ${delay}ms`);
          
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            recoverSession();
          }, delay);
        } else {
          // After maximum attempts, clear any stored data that might be causing issues
          console.log("Maximum reconnect attempts reached. Clearing stored auth data.");
          localStorage.removeItem("supabase.auth.token");
          setAuthError(new Error("Failed to reconnect after multiple attempts"));
          setLoading(false);
          return false;
        }
      }
      
      if (session) {
        console.log("Session recovered successfully:", session.user.id);
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
        setReconnectAttempts(0); // Reset on successful recovery
        setAuthError(null);
        setConnectionOk(true);
        return true;
      } else {
        console.log("No session to recover");
        setReconnectAttempts(0); // Reset counter since we got a valid "no session" response
        setConnectionOk(true);
        setLoading(false); // Important: Set loading to false when we know there's no session
        return false;
      }
    } catch (error) {
      console.error("Unexpected error recovering session:", error);
      setConnectionOk(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get session from Supabase auth
    const setData = async () => {
      try {
        console.log("Initializing auth context...");
        
        // Check connection first
        const isConnected = await checkConnection();
        if (!isConnected) {
          console.warn("Cannot connect to Supabase during initialization");
          setTimeout(() => {
            setReconnectAttempts(1); // Start reconnection process
            recoverSession();
          }, 1000);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
          setAuthError(error);
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
        
        // Set a timeout to ensure loading state doesn't get stuck
        const timeout = setTimeout(() => {
          if (loading) {
            console.log("Auth loading timeout reached, forcing loading to false");
            setLoading(false);
          }
        }, 5000); // 5 second timeout
        
        setAuthTimeout(timeout);
        setLoading(false);
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error setting up auth:", error);
        setAuthError(error as Error);
        setLoading(false);
        setAuthInitialized(true);
        
        // Try to recover
        window.setTimeout(() => {
          recoverSession();
        }, 1000);
      }
    };

    // Add an error handler to the auth subscription
    let subscription: { data: { subscription: { unsubscribe: () => void } } };
    
    try {
      subscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.id);
          
          // Clear error state on successful auth events
          if (session || event === 'SIGNED_OUT') {
            setAuthError(null);
            setConnectionOk(true);
          }
          
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
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
    }

    setData();

    // Add window focus event listener to check session when tab becomes active
    const handleFocus = () => {
      if (authInitialized) {
        console.log("Window focused, checking auth state");
        checkConnection().then(ok => {
          if (ok) {
            recoverSession();
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);

    // Add online status event listeners
    const handleOnline = () => {
      console.log("Browser is online, attempting to reconnect");
      setConnectionOk(true);
      if (authInitialized) {
        // Reset reconnect attempts when coming back online
        setReconnectAttempts(0);
        recoverSession();
      }
    };

    const handleOffline = () => {
      console.log("Browser is offline");
      setConnectionOk(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle storage events for cross-tab auth sync
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('supabase.auth')) {
        console.log("Auth storage changed in another tab, syncing state");
        recoverSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      if (subscription?.data?.subscription) {
        try {
          subscription.data.subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from auth:", error);
        }
      }
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authInitialized]);

  // Define login function
  async function signIn(email: string, password: string) {
    try {
      // Check connection before attempting sign-in
      const isConnected = await checkConnection();
      if (!isConnected) {
        toast({
          title: "Anslutningsproblem",
          description: "Kunde inte ansluta till servern. Kontrollera din internetanslutning.",
          variant: "destructive",
        });
        return { error: new Error("Connection problem") };
      }
      
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
    connectionOk,
  };

  // If there's an auth error and we're not loading anymore, show a toast once
  useEffect(() => {
    if (authError && !loading && authInitialized) {
      console.log("Auth error detected:", authError);
      // Only show the toast if we're not on login/signup pages
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
        toast({
          title: "Problem med inloggningen",
          description: "Din session har upphört. Logga in igen.",
          variant: "destructive",
        });
      }
    }
  }, [authError, loading, authInitialized]);

  // Add a connection status effect to show a toast when connection is lost/restored
  useEffect(() => {
    if (!authInitialized) return;
    
    if (!connectionOk) {
      toast({
        title: "Anslutningsproblem",
        description: "Kunde inte ansluta till servern. Försök uppdatera sidan.",
        variant: "destructive",
      });
    }
  }, [connectionOk, authInitialized]);

  // Use the provider to make auth object available throughout app
  return (
    <AuthContext.Provider value={value}>
      {children}
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
