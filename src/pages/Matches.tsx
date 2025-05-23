import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import MatchList from "../components/MatchList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMatches, supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Match } from "../types/golfer";
import { Loader2 } from "lucide-react";

const Matches = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("matches");

  const { 
    data: matches = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['matches', user?.id],
    queryFn: () => user ? getMatches(user.id) : [],
    enabled: !!user,
    staleTime: 1000 * 60, // Consider data stale after 1 minute
    refetchOnWindowFocus: true,
  });

  // Set up real-time listener to refetch matches when data changes
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('Setting up real-time listener for matches page');
    
    const channel = supabase
      .channel('matches-page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `or(golfer_id.eq.${user.id},matched_with_id.eq.${user.id})`
      }, () => {
        console.log('Match data changed, refetching matches');
        refetch();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('New chat message detected, payload:', payload);
        // Check if this message is related to one of our matches
        const matchId = payload.new.match_id;
        const isRelevantMatch = matches.some(match => match.id === matchId);
        
        if (isRelevantMatch) {
          console.log('Message is for one of our matches, refetching matches');
          refetch();
        } else {
          console.log('Message is not for one of our matches, ignoring');
        }
      })
      .subscribe((status) => {
        console.log('Matches page subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up matches page subscription');
      // Fix: Use the channel.unsubscribe() method directly
      channel.unsubscribe();
    };
  }, [user?.id, refetch, matches]);

  // For now, all matches with status 'confirmed' are treated as confirmed
  const confirmedMatches: Match[] = matches.filter(match => 
    match.status === 'confirmed' || !match.status // Support older matches without status
  );
  
  const pendingMatches: Match[] = matches.filter(match => 
    match.status === 'pending'
  );

  const handleRefetch = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-golf-green-dark">Dina Matchningar</h1>
      </header>
      
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="matches">Matchningar</TabsTrigger>
            <TabsTrigger value="pending">Väntande</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="bg-white rounded-lg shadow-sm p-4">
            {isLoading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-golf-green-dark mb-2" />
                <p className="text-gray-500">Laddar matchningar...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-4">Kunde inte ladda matchningar</p>
                <button 
                  onClick={handleRefetch}
                  className="bg-golf-green-dark text-white px-4 py-2 rounded hover:bg-golf-green-light"
                >
                  Försök igen
                </button>
              </div>
            ) : (
              <MatchList matches={confirmedMatches} key={`confirmed-${confirmedMatches.length}`} />
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="bg-white rounded-lg shadow-sm p-4">
            {isLoading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-golf-green-dark mb-2" />
                <p className="text-gray-500">Laddar...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-4">Kunde inte ladda väntande matchningar</p>
                <button 
                  onClick={handleRefetch}
                  className="bg-golf-green-dark text-white px-4 py-2 rounded hover:bg-golf-green-light"
                >
                  Försök igen
                </button>
              </div>
            ) : (
              pendingMatches.length > 0 ? (
                <MatchList matches={pendingMatches} key={`pending-${pendingMatches.length}`} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Inga väntande förfrågningar</p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Matches;
