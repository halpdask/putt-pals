
import { createClient } from '@supabase/supabase-js';
import { GolferProfile, GolfBag, GolfClub, Match, ChatMessage } from '../types/golfer';

// When using Lovable's Supabase integration, these variables are automatically injected
const supabaseUrl = "https://fsazjbyvxrqpwjajfmkz.supabase.co";
// import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYXpqYnl2eHJxcHdqYWpmbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDE3NjIsImV4cCI6MjA2MjI3Nzc2Mn0.4TFjCzQSUDzclrP90z8B9x33jmrtkWsVdz2xCbBahvY";

// Validate that we have the required configuration values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please ensure your Supabase integration in Lovable is properly configured.');
  throw new Error('Supabase configuration is missing');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Profile functions
export const getProfile = async (userId: string): Promise<GolferProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  if (!data) return null;
  
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
  
  return profile;
};

export const createProfile = async (profile: any): Promise<GolferProfile | null> => {
  try {
    // Convert our GolferProfile to match database schema
    const dbProfile = {
      id: profile.id,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      handicap: profile.handicap,
      location: profile.location,
      bio: profile.bio,
      profile_image: profile.profileImage || profile.profile_image || '',
      round_types: profile.roundTypes || profile.round_types || ['Sällskapsrunda'],
      availability: profile.availability || ['Helger'],
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(dbProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating profile:', error);
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
    
    return { ...newBag, clubs: [] } as unknown as GolfBag;
  }
  
  // If bag exists, get the clubs
  const { data: clubsData, error: clubsError } = await supabase
    .from('clubs')
    .select('*')
    .eq('bag_id', bagData.id);
  
  if (clubsError) {
    console.error('Error fetching clubs:', clubsError);
    return { ...bagData, clubs: [] } as unknown as GolfBag;
  }
  
  return {
    ...bagData,
    clubs: clubsData
  } as unknown as GolfBag;
};

export const addClubToBag = async (bagId: string, club: Omit<GolfClub, 'id'>): Promise<GolfClub | null> => {
  const { data, error } = await supabase
    .from('clubs')
    .insert({
      ...club,
      bag_id: bagId
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding club to bag:', error);
    return null;
  }
  return data as unknown as GolfClub;
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
