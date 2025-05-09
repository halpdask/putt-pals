
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "../components/Navbar";
import GolferCard from "../components/GolferCard";
import { mockGolfers } from "../data/mockGolfers";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GolferProfile, RoundType } from "../types/golfer";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

interface FilterOptions {
  handicapRange: [number, number];
  ageRange: [number, number];
  maxDistance: number;
  roundTypes: RoundType[];
}

const Browse = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingGolfers, setRemainingGolfers] = useState([...mockGolfers]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    handicapRange: [0, 54],
    ageRange: [18, 80],
    maxDistance: 50,
    roundTypes: [],
  });
  const [filteredGolfers, setFilteredGolfers] = useState([...mockGolfers]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const roundTypeOptions: { value: RoundType; label: string }[] = [
    { value: "Sällskapsrunda", label: "Sällskapsrunda" },
    { value: "Träningsrunda", label: "Träningsrunda" },
    { value: "Matchspel", label: "Matchspel" },
    { value: "Foursome", label: "Foursome" },
    { value: "Scramble", label: "Scramble" },
  ];

  useEffect(() => {
    // Shuffle golfers for variety and apply initial filters
    const shuffled = [...mockGolfers].sort(() => Math.random() - 0.5);
    applyFilters(shuffled);
  }, []);

  const applyFilters = (golfers = remainingGolfers) => {
    const userHcp = profile?.handicap || 18;

    const filtered = golfers.filter(golfer => {
      // Filter by handicap range relative to user
      const handicapMin = userHcp - filterOptions.handicapRange[1];
      const handicapMax = userHcp + filterOptions.handicapRange[1];
      if (golfer.handicap < handicapMin || golfer.handicap > handicapMax) {
        return false;
      }

      // Filter by age range
      if (golfer.age < filterOptions.ageRange[0] || golfer.age > filterOptions.ageRange[1]) {
        return false;
      }

      // Filter by round types (if any selected)
      if (filterOptions.roundTypes.length > 0) {
        const hasMatchingRoundType = golfer.roundTypes.some(type => 
          filterOptions.roundTypes.includes(type)
        );
        if (!hasMatchingRoundType) {
          return false;
        }
      }

      // For now we're mocking distance - in reality this would use geolocation
      // We'll assume all golfers are within the max distance for now

      return true;
    });

    setFilteredGolfers(filtered);
    setCurrentIndex(0);
    setFiltersOpen(false);
  };

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
      if (prevIndex + 1 >= filteredGolfers.length) {
        // Reset if we've gone through all golfers
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const handleRoundTypeChange = (type: RoundType, checked: boolean) => {
    setFilterOptions(prev => {
      if (checked) {
        return {
          ...prev,
          roundTypes: [...prev.roundTypes, type],
        };
      } else {
        return {
          ...prev,
          roundTypes: prev.roundTypes.filter((t) => t !== type),
        };
      }
    });
  };

  const formatHandicapLabel = (value: number) => {
    if (profile?.handicap) {
      if (value === 0) return `${profile.handicap}`;
      if (value > 0) return `+${value}`;
      return `${value}`;
    }
    return `${value}`;
  };

  const currentGolfer = filteredGolfers[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-golf-green-dark">Hitta Golfpartners</h1>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Filter size={20} />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtrera golfpartners</SheetTitle>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Handicap (±)</Label>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[filterOptions.handicapRange[1]]}
                      max={50}
                      step={1}
                      onValueChange={([value]) => 
                        setFilterOptions(prev => ({...prev, handicapRange: [0, value]}))
                      }
                    />
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                      <span>0</span>
                      <span>{formatHandicapLabel(filterOptions.handicapRange[1])}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base">Åldersintervall</Label>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[filterOptions.ageRange[0], filterOptions.ageRange[1]]}
                      min={18}
                      max={80}
                      step={1}
                      onValueChange={([min, max]) => 
                        setFilterOptions(prev => ({...prev, ageRange: [min, max]}))
                      }
                    />
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                      <span>{filterOptions.ageRange[0]} år</span>
                      <span>{filterOptions.ageRange[1]} år</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base">Max avstånd</Label>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[filterOptions.maxDistance]}
                      min={5}
                      max={200}
                      step={5}
                      onValueChange={([value]) => 
                        setFilterOptions(prev => ({...prev, maxDistance: value}))
                      }
                    />
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                      <span>5 km</span>
                      <span>{filterOptions.maxDistance} km</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Rundtyper</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {roundTypeOptions.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`roundType-${type.value}`}
                          checked={filterOptions.roundTypes.includes(type.value)}
                          onCheckedChange={(checked) => 
                            handleRoundTypeChange(type.value, checked as boolean)
                          }
                        />
                        <Label htmlFor={`roundType-${type.value}`}>{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => applyFilters()} 
                className="w-full bg-golf-green-dark hover:bg-golf-green-light"
              >
                Tillämpa filter
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.roundTypes.length === 0 ? (
            <Badge variant="outline" className="bg-white">
              Alla rundor
            </Badge>
          ) : (
            filterOptions.roundTypes.map(type => (
              <Badge key={type} variant="outline" className="bg-golf-fairway text-golf-green-dark">
                {type}
              </Badge>
            ))
          )}
          <Badge variant="outline" className="bg-golf-fairway text-golf-green-dark">
            {profile?.handicap ? `Hcp ±${filterOptions.handicapRange[1]}` : 'Alla handicap'}
          </Badge>
          <Badge variant="outline" className="bg-white">
            Max {filterOptions.maxDistance} km
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
