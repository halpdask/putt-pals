
export type RoundType = 'Sällskapsrunda' | 'Träningsrunda' | 'Matchspel' | 'Foursome' | 'Scramble';

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface GolferProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Man' | 'Kvinna' | 'Annat';
  handicap: number;
  homeCourse: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  bio: string;
  profileImage: string;
  roundTypes: RoundType[];
  availability: string[];
  // Add golf bag related fields
  bag?: GolfBag;
  // Add fields for search and filtering
  search_radius_km?: number;
  max_handicap_difference?: number;
  min_age_preference?: number;
  max_age_preference?: number;
}

export type ClubType = 
  | 'Driver' 
  | 'Wood'
  | 'Hybrid'
  | 'Iron'
  | 'Wedge'
  | 'Putter';

export interface GolfClub {
  id: string;
  brand: string;
  model: string;
  type: ClubType;
  loft?: number;
  notes?: string;
  // Foreign key for bag
  bag_id?: string;
}

export interface GolfBag {
  id: string;
  name: string;
  user_id?: string;
  clubs: GolfClub[];
}

export interface Match {
  id: string;
  golferId: string;
  matchedWithId: string;
  timestamp: number;
  lastMessage?: string;
  read: boolean;
  // Add status field for pending/confirmed matches
  status?: 'pending' | 'confirmed' | 'rejected';
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
  read: boolean;
}
