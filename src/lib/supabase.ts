import { createClient } from '@supabase/supabase-js';
import { GolferProfile, GolfBag, GolfClub, Match, ChatMessage } from '../types/golfer';

// When using Lovable's Supabase integration, these variables are automatically injected
const supabaseUrl = "https://fsazjbyvxrqpwjajfmkz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYXpqYnl2eHJxcHdqYWpmbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDE3NjIsImV4cCI6MjA2MjI3Nzc2Mn0.4TFjCzQSUDzclrP90z8B9x33jmrtkWsVdz2xCbBahvY";

// Validate that we have the required configuration values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please ensure your Supabase integration in Lovable is properly configured.');
  throw new Error('Supabase configuration is missing');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Log connection status for diagnostics
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Supabase auth event: ${event}`, session?.user?.id || 'No user');
});

// Attempt to reconnect on page load
const attemptReconnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error reconnecting to Supabase:', error);
    } else {
      console.log('Reconnected to Supabase successfully:', data.session?.user?.id || 'No active session');
    }
  } catch (err) {
    console.error('Failed to reconnect to Supabase:', err);
  }
};

// Try to reconnect when this module loads
attemptReconnection();

// Auth functions
export const signIn = async (email: string, password: string) => {
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    // Log additional details for debugging
    if (result.error) {
      console.error('Sign in error details:', result.error);
    } else {
      console.log('Sign in successful for:', result.data.user?.id);
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { data: { user: null, session: null }, error };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const result = await supabase.auth.signUp({ email, password });
    
    if (result.error) {
      console.error('Sign up error details:', result.error);
    } else {
      console.log('Sign up successful for:', result.data.user?.id);
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return { data: { user: null, session: null }, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      console.log('Sign out successful');
    }
    return { error };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { error };
  }
};

// Profile functions
export const getProfile = async (userId: string): Promise<GolferProfile | null> => {
  try {
    console.log('Fetching profile for user:', userId);
    
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId provided to getProfile:', userId);
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    if (!data) {
      console.log('No profile found for user:', userId);
      return null;
    }
    
    // Map database fields to our GolferProfile type
    const profile: GolferProfile = {
      id: data.id,
      name: data.name || '',
      age: data.age || 30,
      gender: data.gender || 'Man',
      handicap: data.handicap || 18,
      homeCourse: data.home_course || '',
      location: data.location || '',
      bio: data.bio || '',
      profileImage: data.profile_image || '',
      roundTypes: data.round_types || ['Sällskapsrunda'],
      availability: data.availability || ['Helger'],
    };
    
    console.log('Successfully retrieved profile for user:', userId);
    return profile;
  } catch (error) {
    console.error('Unexpected error in getProfile:', error);
    return null;
  }
};

export const createProfile = async (profile: Partial<GolferProfile>): Promise<GolferProfile | null> => {
  try {
    // Convert our GolferProfile to match database schema
    const dbProfile = {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      handicap: profile.handicap,
      home_course: profile.homeCourse || '',
      location: profile.location || '',
      bio: profile.bio || '',
      profile_image: profile.profileImage || '',
      round_types: profile.roundTypes || ['Sällskapsrunda'],
      availability: profile.availability || ['Helger'],
    };
    
    console.log('Creating profile with data:', dbProfile);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(dbProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }
    
    console.log('Profile created successfully:', data);
    
    // Map back to our app's GolferProfile type
    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      handicap: data.handicap,
      homeCourse: data.home_course || '',
      location: data.location || '',
      bio: data.bio || '',
      profileImage: data.profile_image || '',
      roundTypes: data.round_types || ['Sällskapsrunda'],
      availability: data.availability || ['Helger'],
    } as GolferProfile;
  } catch (error) {
    console.error('Error in createProfile:', error);
    return null;
  }
};

export const updateProfile = async (profile: GolferProfile): Promise<GolferProfile | null> => {
  try {
    // Convert our GolferProfile to match database schema
    const dbProfile = {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      handicap: profile.handicap,
      home_course: profile.homeCourse || '',
      location: profile.location || '',
      bio: profile.bio || '',
      profile_image: profile.profileImage || '',
      round_types: profile.roundTypes || ['Sällskapsrunda'],
      availability: profile.availability || ['Helger'],
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(dbProfile)
      .eq('id', profile.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    
    // Map back to our app's GolferProfile type
    return {
      id: data.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      handicap: data.handicap,
      homeCourse: data.home_course || '',
      location: data.location || '',
      bio: data.bio || '',
      profileImage: data.profile_image || '',
      roundTypes: data.round_types || ['Sällskapsrunda'],
      availability: data.availability || ['Helger'],
    } as GolferProfile;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return null;
  }
};

// Golf Bag functions
export const getGolfBag = async (userId: string): Promise<GolfBag | null> => {
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided to getGolfBag:', userId);
    return null;
  }
  
  try {
    console.log('Fetching golf bag for user:', userId);
    
    // First check if the user has a bag
    const { data: bagData, error: bagError } = await supabase
      .from('golf_bags')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (bagError && bagError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching golf bag:', bagError);
      return null;
    }
    
    // If no bag exists, create one
    if (!bagData) {
      console.log('No bag found for user, creating new bag:', userId);
      
      const { data: newBag, error: createError } = await supabase
        .from('golf_bags')
        .insert({
          user_id: userId,
          name: 'Min Golfbag'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating golf bag:', createError);
        return null;
      }
      
      console.log('Successfully created new golf bag:', newBag.id);
      return { ...newBag, clubs: [] } as unknown as GolfBag;
    }
    
    console.log('Found existing golf bag:', bagData.id);
    
    // If bag exists, get the clubs
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .eq('bag_id', bagData.id);
    
    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      return { ...bagData, clubs: [] } as unknown as GolfBag;
    }
    
    console.log(`Found ${clubsData?.length || 0} clubs in bag ${bagData.id}`);
    
    return {
      ...bagData,
      clubs: clubsData || []
    } as unknown as GolfBag;
  } catch (error) {
    console.error('Unexpected error in getGolfBag:', error);
    return null;
  }
};

export const addClubToBag = async (bagId: string, club: Omit<GolfClub, 'id'>): Promise<GolfClub | null> => {
  try {
    if (!bagId || typeof bagId !== 'string') {
      console.error('Invalid bagId provided to addClubToBag:', bagId);
      return null;
    }
    
    console.log('Adding club to bag:', bagId, club);
    
    // Make sure the bag_id is properly set in the inserted club data
    const clubData = {
      ...club,
      bag_id: bagId
    };
    
    console.log('Club data to insert:', clubData);
    
    const { data, error } = await supabase
      .from('clubs')
      .insert(clubData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding club to bag:', error);
      return null;
    }
    
    console.log('Successfully added club:', data);
    return data as unknown as GolfClub;
  } catch (error) {
    console.error('Unexpected error in addClubToBag:', error);
    return null;
  }
};

// Match functions
export const getMatches = async (userId: string): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`golferId.eq.${userId},matchedWithId.eq.${userId}`);
  
  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  if (!data) return [];
  return data as unknown as Match[];
};

export const createMatch = async (match: Omit<Match, 'id'>): Promise<Match | null> => {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating match:', error);
    return null;
  }
  return data as unknown as Match;
};

// Messages functionality
export const getChatMessages = async (matchId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('match_id', matchId)
    .order('timestamp', { ascending: true });
  
  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
  if (!data) return [];
  return data as unknown as ChatMessage[];
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>): Promise<ChatMessage | null> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...message,
      timestamp: Date.now(),
      read: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error sending chat message:', error);
    return null;
  }
  return data as unknown as ChatMessage;
};
