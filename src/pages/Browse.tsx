import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "../components/Navbar";
import GolferCard from "../components/GolferCard";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCcw } from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllProfiles, createMatch } from "../lib/supabase";
import { Card } from "@/components/ui/card";
import { mockGolfers } from "../data/mockGolfers"; // Keep as fallback

interface FilterOptions {
  handicapRange: [number, number];
  ageRange: [number, number];
  maxDistance: number;
  roundTypes: RoundType[];
}

const Browse = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    handicapRange: [0, 54],
    ageRange: [18, 80],
    maxDistance: 50,
    roundTypes: [],
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [hasSwipedAll, setHasSwipedAll] = useState(false);
  const { toast } = useToast();
  const { user, profile, connectionOk, loading: authLoading } = useAuth();
  
  const queryClient = useQueryClient();
  
  // Fetch profiles from the database with improved error handling
  const { 
    data: fetchedProfiles, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("No user ID found");
      }
      
      try {
        const profiles = await getAllProfiles(user.id);
        return profiles;
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setLoadingError("Failed to load golfer profiles");
        throw err;
      }
    },
    enabled: !!user?.id && connectionOk,
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const [filteredGolfers, setFilteredGolfers] = useState<GolferProfile[]>([]);

  const roundTypeOptions: { value: RoundType; label: string }[] = [
    { value: "Sällskapsrunda", label: "Sällskapsrunda" },
    { value: "Träningsrunda", label: "Träningsrunda" },
    { value: "Matchspel", label: "Matchspel" },
    { value: "Foursome", label: "Foursome" },
    { value: "Scramble", label: "Scramble" },
  ];
  
  // Track loading time to detect potential infinite loading issues
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);
  
  // Show manual retry option if loading takes too long
  useEffect(() => {
    if (loadingTime > 10 && isLoading) {
      setLoadingError("Loading is taking longer than expected");
    }
  }, [loadingTime, isLoading]);

  useEffect(() => {
    if (fetchedProfiles && fetchedProfiles.length > 0) {
      // Shuffle profiles for variety and apply initial filters
      const shuffled = [...fetchedProfiles].sort(() => Math.random() - 0.5);
      applyFilters(shuffled);
    }
  }, [fetchedProfiles]);

  const applyFilters = (golfers = fetchedProfiles || []) => {
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

  const handleLike = async (id: string) => {
    if (!user) {
      toast({
        title: "Logga in först",
        description: "Du måste vara inloggad för att matcha med andra golfare",
        variant: "destructive",
      });
      return;
    }
    
    // Set loading state
    setIsCreatingMatch(true);
    
    // Create a match in the database
    try {
      const match = {
        golferId: user.id,
        matchedWithId: id,
        timestamp: Date.now(),
        read: false,
        status: 'confirmed' as const, // Change from 'pending' to 'confirmed' to make matches appear immediately
        lastMessage: "Ny matchning!" // Add default last message
      };
      
      console.log("Creating match with data:", match);
      const createdMatch = await createMatch(match);
      
      if (createdMatch) {
        console.log("Match created successfully:", createdMatch);
        // Invalidate matches query to refresh the matches list
        await queryClient.invalidateQueries({queryKey: ['matches', user.id]});
        
        toast({
          title: "Matchning!",
          description: "Du gillade denna golfaren, ni är nu matchade!",
        });
        goToNextGolfer();
      } else {
        throw new Error("Returned null match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte skapa matchning just nu",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleDislike = (id: string) => {
    goToNextGolfer();
  };

  const goToNextGolfer = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex + 1 >= filteredGolfers.length) {
        // No more golfers to show
        setHasSwipedAll(true);
        return prevIndex;
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
  
  const handleRetry = () => {
    setLoadingError(null);
    setLoadingTime(0);
    refetch();
  };

  const handleRetryBrowse = () => {
    // Shuffle profiles again and reset
    if (fetchedProfiles && fetchedProfiles.length > 0) {
      const shuffled = [...fetchedProfiles].sort(() => Math.random() - 0.5);
      setFilteredGolfers(shuffled);
      setCurrentIndex(0);
      setHasSwipedAll(false);
    } else {
      // If no profiles, try to refetch
      refetch();
    }
  };

  // Show loading state while authentication is being initialized
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
          <p className="text-golf-green-dark font-semibold">Kontrollerar inloggning...</p>
        </div>
        <Navbar />
      </div>
    );
  }
  
  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Logga in för att fortsätta</h2>
          <p className="mb-6">Du måste vara inloggad för att se golfpartners.</p>
          <Button 
            onClick={() => window.location.href = "/login"}
            className="bg-golf-green-dark hover:bg-golf-green-light"
          >
            Gå till inloggning
          </Button>
        </div>
        <Navbar />
      </div>
    );
  }

  // Show loading state while fetching profiles
  if (isLoading && !loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
          <p className="text-golf-green-dark font-semibold">Laddar golfare...</p>
          {loadingTime > 5 && (
            <p className="text-sm text-gray-500 mt-2">Det tar lite tid...</p>
          )}
        </div>
        <Navbar />
      </div>
    );
  }

  // Show error state if there was an issue fetching profiles
  if (isError || loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-4">
            {loadingError || "Det gick inte att hämta golfprofilerna just nu."}
          </p>
          <Button 
            onClick={handleRetry}
            className="mt-4 bg-golf-green-dark hover:bg-golf-green-light flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Försök igen
          </Button>
        </div>
        <Navbar />
      </div>
    );
  }

  const currentGolfer = !hasSwipedAll && filteredGolfers.length > 0 
    ? filteredGolfers[currentIndex % filteredGolfers.length] 
    : null;

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
            disabled={isCreatingMatch}
          />
        ) : (
          <Card className="golf-card h-[70vh] max-h-[600px] w-full max-w-md mx-auto bg-white flex flex-col items-center justify-center text-center p-8">
            <img 
              src="/placeholder.svg" 
              alt="No golfers" 
              className="w-40 h-40 mb-6 opacity-30"
            />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Inga fler golfpartners
            </h3>
            <p className="text-gray-500 mb-8 max-w-xs">
              {hasSwipedAll 
                ? "Du har sett alla potentiella golfpartners som matchar dina filter." 
                : "Det finns inga golfpartners som matchar dina valda filter."}
            </p>
            <Button 
              onClick={handleRetryBrowse}
              className="bg-golf-green-dark hover:bg-golf-green-light flex items-center"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {hasSwipedAll ? "Se golfpartners igen" : "Ändra dina filter"}
            </Button>
          </Card>
        )}
      </div>
      
      <Navbar />
    </div>
  );
};

export default Browse;
