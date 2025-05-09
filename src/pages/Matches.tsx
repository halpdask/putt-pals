
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import MatchList from "../components/MatchList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMatches } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Match } from "../types/golfer";

const Matches = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("matches");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', user?.id],
    queryFn: () => user ? getMatches(user.id) : [],
    enabled: !!user
  });

  // For now, all matches are treated as confirmed
  // In a real app, this would be determined by match status
  const confirmedMatches: Match[] = matches;
  const pendingMatches: Match[] = [];

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
                <p className="text-gray-500">Laddar matchningar...</p>
              </div>
            ) : (
              <MatchList matches={confirmedMatches} />
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="bg-white rounded-lg shadow-sm p-4">
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Laddar...</p>
              </div>
            ) : (
              pendingMatches.length > 0 ? (
                <MatchList matches={pendingMatches} />
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
