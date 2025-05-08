
import { createClient } from '@supabase/supabase-js';
import { GolferProfile, GolfBag, GolfClub, Match } from '../types/golfer';

// Get the Supabase URL and public anon key from environment variables
// These will be available after connecting to Supabase in Lovable
const supabaseUrl = "https://fsazjbyvxrqpwjajfmkz.supabase.co";
// import.meta.env.VITE_SUPABASE_URL;
// import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYXpqYnl2eHJxcHdqYWpmbWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDE3NjIsImV4cCI6MjA2MjI3Nzc2Mn0.4TFjCzQSUDzclrP90z8B9x33jmrtkWsVdz2xCbBahvY";


// Check if the required values are available
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Please check your Supabase integration in Lovable.');
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
  
  if (error || !data) return null;
  return data as unknown as GolferProfile;
};

export const updateProfile = async (profile: GolferProfile): Promise<GolferProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', profile.id)
    .select()
    .single();
  
  if (error || !data) return null;
  return data as unknown as GolferProfile;
};

// Golf Bag functions
export const getGolfBag = async (userId: string): Promise<GolfBag | null> => {
  const { data, error } = await supabase
    .from('golf_bags')
    .select('*, clubs(*)')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data as unknown as GolfBag;
};

export const addClubToBag = async (bagId: string, club: GolfClub): Promise<GolfClub | null> => {
  const { data, error } = await supabase
    .from('clubs')
    .insert({
      ...club,
      bag_id: bagId
    })
    .select()
    .single();
  
  if (error || !data) return null;
  return data as unknown as GolfClub;
};

// Match functions
export const getMatches = async (userId: string): Promise<Match[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`golferId.eq.${userId},matchedWithId.eq.${userId}`);
  
  if (error || !data) return [];
  return data as unknown as Match[];
};

export const createMatch = async (match: Omit<Match, 'id'>): Promise<Match | null> => {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single();
  
  if (error || !data) return null;
  return data as unknown as Match;
};
