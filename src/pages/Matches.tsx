
import Navbar from "../components/Navbar";
import MatchList from "../components/MatchList";
import { mockMatches } from "../data/mockGolfers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Matches = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-golf-green-dark">Dina Matchningar</h1>
      </header>
      
      <div className="container mx-auto p-4">
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="matches">Matchningar</TabsTrigger>
            <TabsTrigger value="pending">Väntande</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="bg-white rounded-lg shadow-sm p-4">
            <MatchList matches={mockMatches} />
          </TabsContent>
          
          <TabsContent value="pending" className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-center py-10">
              <p className="text-gray-500">Inga väntande förfrågningar</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Matches;
