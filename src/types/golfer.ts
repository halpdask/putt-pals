
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
}

export interface GolfClub {
  id: string;
  brand: string;
  model: string;
  type: ClubType;
  loft?: number;
  notes?: string;
}

export type ClubType = 
  | 'Driver' 
  | 'Wood'
  | 'Hybrid'
  | 'Iron'
  | 'Wedge'
  | 'Putter';

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
}
