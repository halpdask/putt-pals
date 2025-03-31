
import { useEffect, useState } from "react";
import { Match, GolferProfile } from "../types/golfer";
import { mockGolfers } from "../data/mockGolfers";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MatchListProps {
  matches: Match[];
}

const MatchList = ({ matches }: MatchListProps) => {
  const [matchedProfiles, setMatchedProfiles] = useState<GolferProfile[]>([]);

  useEffect(() => {
    // In a real app, you would fetch these profiles from an API
    const profiles = matches.map(match => {
      return mockGolfers.find(golfer => golfer.id === match.matchedWithId);
    }).filter((profile): profile is GolferProfile => profile !== undefined);
    
    setMatchedProfiles(profiles);
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Du har inga matchningar än. Börja swipa för att hitta golfpartners!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, index) => {
        const profile = matchedProfiles.find(p => p.id === match.matchedWithId);
        if (!profile) return null;
        
        return (
          <div 
            key={match.id} 
            className={`p-4 border rounded-lg flex items-center space-x-4 ${!match.read ? 'bg-green-50 border-golf-green-light' : 'bg-white'}`}
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.profileImage} alt={profile.name} />
              <AvatarFallback>{profile.name[0]}{profile.name.split(' ')[1]?.[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg truncate">{profile.name}</h3>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(match.timestamp, { addSuffix: true, locale: sv })}
                </span>
              </div>
              
              <div className="mt-1 flex items-center">
                <Badge variant="outline" className="mr-2 bg-golf-fairway text-golf-green-dark">
                  Hcp {profile.handicap}
                </Badge>
                <span className="text-sm text-gray-600 truncate">
                  {match.lastMessage || "Ny matchning!"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchList;
