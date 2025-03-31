
export type RoundType = 'Sällskapsrunda' | 'Träningsrunda' | 'Matchspel' | 'Foursome' | 'Scramble';

export interface GolferProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Man' | 'Kvinna' | 'Annat';
  handicap: number;
  homeCourse: string;
  location: string;
  bio: string;
  profileImage: string;
  roundTypes: RoundType[];
  availability: string[];
}

export interface Match {
  id: string;
  golferId: string;
  matchedWithId: string;
  timestamp: number;
  lastMessage?: string;
  read: boolean;
}
