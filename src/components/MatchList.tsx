
import { useEffect, useState } from "react";
import { Match, GolferProfile } from "../types/golfer";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getMatches, getProfile } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import ChatDialog from "./ChatDialog";
import { mockGolfers } from "../data/mockGolfers"; // Keep as fallback
import { Loader2 } from "lucide-react";

interface MatchListProps {
  matches: Match[];
}

const MatchList = ({ matches }: MatchListProps) => {
  const { user } = useAuth();
  const [matchedProfiles, setMatchedProfiles] = useState<GolferProfile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<{match: Match, profile: GolferProfile} | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  
  // Fetch profile data for each match
  useEffect(() => {
    const fetchMatchedProfiles = async () => {
      if (!matches.length) return;
      
      setIsLoadingProfiles(true);
      const profiles: GolferProfile[] = [];
      
      try {
        for (const match of matches) {
          const matchedId = match.golferId === user?.id ? match.matchedWithId : match.golferId;
          try {
            console.log(`Fetching profile for matched user ID: ${matchedId}`);
            // Try to get the profile from the database
            const fetchedProfile = await getProfile(matchedId);
            if (fetchedProfile) {
              console.log(`Successfully fetched profile for ID ${matchedId}:`, fetchedProfile);
              profiles.push(fetchedProfile);
            } else {
              console.log(`No profile found for ID ${matchedId}, trying mockdata`);
              // Fallback to mock data if profile not found
              const mockProfile = mockGolfers.find(golfer => golfer.id === matchedId);
              if (mockProfile) {
                console.log(`Found mock profile for ID ${matchedId}`);
                profiles.push(mockProfile);
              } else {
                console.log(`No mock profile found for ID ${matchedId} either`);
              }
            }
          } catch (error) {
            console.error(`Error fetching profile for ID ${matchedId}:`, error);
          }
        }
        
        console.log(`Fetched ${profiles.length} profiles for ${matches.length} matches`);
        setMatchedProfiles(profiles);
      } catch (error) {
        console.error('Error in fetchMatchedProfiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    
    fetchMatchedProfiles();
  }, [matches, user?.id]);

  if (isLoadingProfiles) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-golf-green-dark mb-2" />
        <p className="text-gray-500">Laddar profiler...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Du har inga matchningar än. Börja swipa för att hitta golfpartners!</p>
      </div>
    );
  }

  const handleOpenChat = (match: Match, profile: GolferProfile) => {
    setSelectedMatch({ match, profile });
  };

  const handleCloseChat = () => {
    setSelectedMatch(null);
  };

  return (
    <div className="space-y-4">
      {matches.map((match, index) => {
        const profile = matchedProfiles.find(p => 
          p.id === (match.golferId === user?.id ? match.matchedWithId : match.golferId)
        );
        
        if (!profile) {
          console.log(`No profile found for match:`, match);
          return null;
        }
        
        return (
          <div 
            key={match.id} 
            className={`p-4 border rounded-lg flex items-center space-x-4 ${!match.read ? 'bg-green-50 border-golf-green-light' : 'bg-white'} cursor-pointer`}
            onClick={() => handleOpenChat(match, profile)}
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

      {selectedMatch && (
        <ChatDialog
          isOpen={!!selectedMatch}
          onClose={handleCloseChat}
          matchId={selectedMatch.match.id}
          matchedProfile={selectedMatch.profile}
        />
      )}
    </div>
  );
};

export default MatchList;
