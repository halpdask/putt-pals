
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ClubType, GolfBag, GolfClub } from "../types/golfer";
import { getGolfBag, addClubToBag } from "../lib/supabase";

const clubTypes: ClubType[] = [
  'Driver', 
  'Wood',
  'Hybrid',
  'Iron',
  'Wedge',
  'Putter'
];

const mockBrands = [
  "Callaway", "TaylorMade", "Titleist", "Ping", "Mizuno", "Cleveland", "Srixon", "Cobra", "Wilson"
];

interface AddClubFormProps {
  bagId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddClubForm = ({ bagId, onSuccess, onCancel }: AddClubFormProps) => {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState<ClubType>("Iron");
  const [loft, setLoft] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrands, setShowBrands] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const filteredBrands = brandSearch
    ? mockBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : mockBrands;

  const addClubMutation = useMutation({
    mutationFn: (club: Omit<GolfClub, "id">) => {
      console.log('Mutation called with bag ID:', bagId);
      
      // Extra validation - ensure UUID format
      if (!bagId || bagId === "new" || typeof bagId !== 'string' || 
          !bagId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        console.error('Invalid or missing bag ID:', bagId);
        throw new Error('A valid bag ID is required to add clubs');
      }
      
      console.log('Club data being sent:', club);
      return addClubToBag(bagId, club);
    },
    onSuccess: (data) => {
      if (!data) {
        console.error('Club addition succeeded but returned null data');
        toast({
          title: "Varning",
          description: "Klubban kan ha lagts till, men vi kunde inte bekräfta. Uppdatera sidan för att se.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Club added successfully, returned data:', data);
      // Force a fresh refetch from server
      queryClient.invalidateQueries({ queryKey: ['golfBag'], refetchType: 'all' });
      toast({
        title: "Klubba tillagd",
        description: "Klubban har lagts till i din bag"
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      
      // Handle specific error types
      if ((error as Error).message?.includes('invalid input syntax for type uuid')) {
        toast({
          title: "Tekniskt fel",
          description: "Problem med bag ID. Uppdatera sidan och försök igen.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte lägga till klubban. Kontrollera din anslutning och försök igen.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brand || !model || !type) {
      toast({
        title: "Ofullständig information",
        description: "Fyll i märke, modell och typ",
        variant: "destructive"
      });
      return;
    }

    // Enhanced validation that bag ID is a valid UUID
    if (!bagId || bagId === "new" || !bagId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      console.error('Missing or invalid bagId when adding club:', bagId);
      toast({
        title: "Tekniskt fel",
        description: "Din golfbag behöver skapas först. Uppdatera sidan och försök igen.",
        variant: "destructive"
      });
      return;
    }

    const newClub = {
      brand,
      model,
      type,
      loft,
      notes: notes || undefined,
      bag_id: bagId
    };

    console.log('Submitting new club:', newClub, 'to bag:', bagId);
    addClubMutation.mutate(newClub);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="brand">Märke</Label>
        <div className="relative">
          <Input
            id="brand"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            onFocus={() => setShowBrands(true)}
            placeholder="Sök märke..."
            className="pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          
          {showBrands && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredBrands.map((b) => (
                <div 
                  key={b} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setBrand(b);
                    setBrandSearch(b);
                    setShowBrands(false);
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="model">Modell</Label>
        <Input
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="t.ex. Stealth Plus"
        />
      </div>
      
      <div>
        <Label htmlFor="type">Typ</Label>
        <Select value={type} onValueChange={(value) => setType(value as ClubType)}>
          <SelectTrigger>
            <SelectValue placeholder="Välj klubbtyp" />
          </SelectTrigger>
          <SelectContent>
            {clubTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="loft">Loft (valfritt)</Label>
        <Input
          id="loft"
          type="number"
          value={loft || ''}
          onChange={(e) => setLoft(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="t.ex. 10.5"
        />
      </div>
      
      <div>
        <Label htmlFor="notes">Anteckningar (valfritt)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ytterligare information..."
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} type="button">Avbryt</Button>
        <Button type="submit" className="bg-golf-green-dark hover:bg-golf-green-light">
          Lägg till klubba
        </Button>
      </div>
    </form>
  );
};

const GolfBagPage = () => {
  const { user, connectionOk } = useAuth();
  const [isAddingClub, setIsAddingClub] = useState(false);
  const { toast } = useToast();
  
  const { 
    data: bag, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery({
    queryKey: ['golfBag', user?.id],
    queryFn: async () => {
      console.log('Fetching golf bag for user:', user?.id);
      if (!user?.id) {
        console.error('Missing user ID when fetching golf bag');
        return null;
      }
      
      // Add explicit timeout to the query
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const result = await getGolfBag(user.id);
        console.log('Fetched golf bag:', result);
        
        if (!result) {
          console.error('No golf bag found for user');
        }
        
        return result;
      } catch (error) {
        console.error('Error in golf bag query:', error);
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    enabled: !!user?.id && connectionOk,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: attempt => Math.min(1000 * (2 ** attempt), 15000)
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching golf bag:', error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte hämta din golfbag",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Add a retry button in case fetching fails
  const handleRetry = () => {
    console.log('Retrying golf bag fetch');
    refetch();
  };

  if (!connectionOk) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-golf-green-dark">Min Golfbag</h1>
        </header>
        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Anslutningsproblem</h2>
            <p className="text-gray-600 mb-6">
              Kunde inte ansluta till servern. Kontrollera din internetanslutning.
            </p>
            <Button 
              className="bg-golf-green-dark hover:bg-golf-green-light"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Uppdatera sidan
            </Button>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-golf-green-dark">Min Golfbag</h1>
        </header>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
              <p>Laddar...</p>
            </div>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-golf-green-dark">Min Golfbag</h1>
        </header>
        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Kunde inte ladda golfbag</h2>
            <p className="text-gray-600 mb-6">
              Det uppstod ett problem vid hämtning av din golfbag.
            </p>
            <Button 
              className="bg-golf-green-dark hover:bg-golf-green-light"
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Försök igen
            </Button>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  // Check if bag exists and has a valid ID before allowing club addition
  const showAddClubDialog = () => {
    if (!bag?.id || !bag.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      toast({
        title: "Skapa golfbag först",
        description: "Vi behöver skapa en golfbag åt dig innan du kan lägga till klubbor. Uppdatera sidan och försök igen.",
        variant: "destructive"
      });
      // Force a refresh to ensure we get the bag
      refetch();
      return;
    }
    setIsAddingClub(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-golf-green-dark">Min Golfbag</h1>
      </header>
      
      <div className="container mx-auto p-4">
        {!bag || !bag.id || bag.clubs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Flag className="h-12 w-12 mx-auto text-golf-green-dark mb-4" />
            <h2 className="text-xl font-semibold mb-2">Din golfbag är tom</h2>
            <p className="text-gray-600 mb-6">
              Lägg till dina klubbor för att få bättre matchningar med andra golfare
            </p>
            
            {!bag || !bag.id ? (
              <Button 
                className="bg-golf-green-dark hover:bg-golf-green-light"
                onClick={() => refetch()}
              >
                Skapa golfbag
              </Button>
            ) : (
              <Dialog open={isAddingClub} onOpenChange={setIsAddingClub}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-golf-green-dark hover:bg-golf-green-light"
                    onClick={() => showAddClubDialog()}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Lägg till första klubban
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lägg till klubba</DialogTitle>
                  </DialogHeader>
                  <AddClubForm 
                    bagId={bag.id}
                    onSuccess={() => setIsAddingClub(false)}
                    onCancel={() => setIsAddingClub(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{bag?.name || "Min Golfbag"}</h2>
                <Dialog open={isAddingClub} onOpenChange={setIsAddingClub}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-golf-green-dark hover:bg-golf-green-light"
                      onClick={() => showAddClubDialog()}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Lägg till klubba
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lägg till klubba</DialogTitle>
                    </DialogHeader>
                    <AddClubForm 
                      bagId={bag.id}
                      onSuccess={() => setIsAddingClub(false)}
                      onCancel={() => setIsAddingClub(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="divide-y">
                {bag?.clubs.map((club) => (
                  <div key={club.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{club.brand} {club.model}</h3>
                        <p className="text-sm text-gray-600">{club.type} {club.loft ? `(${club.loft}°)` : ''}</p>
                      </div>
                    </div>
                    {club.notes && <p className="mt-1 text-sm text-gray-500">{club.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      <Navbar />
    </div>
  );
};

export default GolfBagPage;
