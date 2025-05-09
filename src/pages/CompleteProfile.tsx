
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileForm from "../components/ProfileForm";
import { GolferProfile } from "../types/golfer";
import { createProfile, getProfile } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const CompleteProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GolferProfile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Create default profile for new users
  const createDefaultProfile = (): GolferProfile => {
    return {
      id: user?.id || "",
      name: "",
      age: 30,
      gender: "Man",
      handicap: 18,
      homeCourse: "",
      location: "",
      bio: "",
      profileImage: "",
      roundTypes: ["Sällskapsrunda"],
      availability: ["Helger"],
      search_radius_km: 50,
      max_handicap_difference: 10,
      min_age_preference: 18,
      max_age_preference: 100,
    };
  };

  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user) {
        console.log("No user found, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        console.log("Checking if user has profile:", user.id);
        // Check if user already has a profile
        const existingProfile = await getProfile(user.id);
        
        if (existingProfile) {
          console.log("User already has profile, redirecting to profile page");
          // If user already has a profile, redirect to profile page
          navigate("/profile");
        } else {
          console.log("Creating default profile state for new user");
          // Create a new default profile state (not saved to DB yet)
          setProfile(createDefaultProfile());
        }
      } catch (error) {
        console.error("Error fetching/creating profile:", error);
        toast({
          title: "Ett fel inträffade",
          description: "Kunde inte hämta eller skapa profil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user, navigate, toast]);

  const handleSaveProfile = async (updatedProfile: GolferProfile) => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Saving profile for user:", user.id);
      // Make sure ID is set correctly
      updatedProfile.id = user.id;
      
      // Save to database
      const savedProfile = await createProfile(updatedProfile);
      
      if (savedProfile) {
        toast({
          title: "Profil sparad",
          description: "Din profil har skapats framgångsrikt",
        });
        console.log("Profile saved successfully, redirecting to profile page");
        navigate("/profile");
      } else {
        throw new Error("Kunde inte spara profil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte spara profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
          <p className="text-golf-green-dark">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-golf-green-dark text-center">Slutför din profil</h1>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-6">
            För att hjälpa dig hitta perfekta golfpartners, behöver vi lite mer information om dig och dina golfpreferenser.
          </p>
          
          {profile && <ProfileForm profile={profile} onSave={handleSaveProfile} />}
          
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/browse")}
              className="text-gray-500"
            >
              Hoppa över för nu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
