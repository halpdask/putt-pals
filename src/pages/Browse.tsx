
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "../components/Navbar";
import GolferCard from "../components/GolferCard";
import { mockGolfers } from "../data/mockGolfers";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

const Browse = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingGolfers, setRemainingGolfers] = useState([...mockGolfers]);
  const { toast } = useToast();

  useEffect(() => {
    // Shuffle golfers for variety
    setRemainingGolfers([...mockGolfers].sort(() => Math.random() - 0.5));
  }, []);

  const handleLike = (id: string) => {
    toast({
      title: "Matchning!",
      description: "Du gillade denna golfaren",
      variant: "default",
    });
    
    // In a real app, you would send this match to a backend
    goToNextGolfer();
  };

  const handleDislike = (id: string) => {
    goToNextGolfer();
  };

  const goToNextGolfer = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex + 1 >= remainingGolfers.length) {
        // Reset if we've gone through all golfers
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const currentGolfer = remainingGolfers[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-golf-green-dark">Hitta Golfpartners</h1>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Filter size={20} />
        </button>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-white">
            Alla rundor
          </Badge>
          <Badge variant="outline" className="bg-golf-fairway text-golf-green-dark">
            &lt; 30 km
          </Badge>
          <Badge variant="outline" className="bg-white">
            Hcp +/-5
          </Badge>
        </div>
        
        {currentGolfer ? (
          <GolferCard 
            golfer={currentGolfer} 
            onLike={handleLike} 
            onDislike={handleDislike} 
          />
        ) : (
          <div className="golf-card h-[70vh] max-h-[600px] w-full max-w-md mx-auto bg-white flex items-center justify-center">
            <p className="text-gray-500 text-center p-8">
              Inga fler golfare att visa just nu. Kom tillbaka senare!
            </p>
          </div>
        )}
      </div>
      
      <Navbar />
    </div>
  );
};

export default Browse;
