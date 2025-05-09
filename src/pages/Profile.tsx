
import { useState } from "react";
import { Flag, Settings, LogOut } from "lucide-react";
import Navbar from "../components/Navbar";
import ProfileForm from "../components/ProfileForm";
import { GolferProfile } from "../types/golfer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile, signOut } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch profile data from Supabase
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => user ? getProfile(user.id) : null,
    enabled: !!user,
  });

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Utloggning misslyckades",
        description: "Försök igen senare.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async (updatedProfile: GolferProfile) => {
    try {
      console.log("Saving profile updates:", updatedProfile);
      // Make sure the ID is set correctly
      if (user && profile) {
        updatedProfile.id = user.id;
        const result = await updateProfile(updatedProfile);
        
        if (result) {
          toast({
            title: "Profil uppdaterad",
            description: "Dina profiländringar har sparats",
          });
          console.log("Profile updated successfully");
          refetch(); // Refresh profile data
        } else {
          throw new Error("Failed to update profile");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte uppdatera profil",
        variant: "destructive",
      });
    }
  };

  const handlePreferencesSave = async () => {
    if (!profile) return;
    
    try {
      await updateProfile(profile);
      toast({
        title: "Preferenser sparade",
        description: "Dina preferenser har uppdaterats",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Ett fel inträffade",
        description: "Kunde inte spara preferenser",
        variant: "destructive",
      });
    }
  };

  const handlePreferencesChange = (field: string, value: any) => {
    if (!profile) return;
    
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
          <p className="text-golf-green-dark">Laddar profil...</p>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Kunde inte ladda profilen. Vänligen försök igen senare.</p>
          <Button 
            onClick={() => refetch()}
            className="mt-4 bg-golf-green-dark hover:bg-golf-green-light"
          >
            Försök igen
          </Button>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-golf-green-dark">Min Profil</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings size={20} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleSignOut}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-golf-green-light">
              <AvatarImage src={profile.profileImage} alt={profile.name} />
              <AvatarFallback className="bg-golf-green-dark text-white">
                {profile.name ? (profile.name[0] + (profile.name.split(' ')[1]?.[0] || '')) : 'GP'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">{profile.name || "Namn saknas"}</h2>
              <div className="flex items-center mt-1 text-gray-600">
                <Flag className="w-4 h-4 mr-1" />
                <span>Hcp {profile.handicap}</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-4 w-full border-golf-green-dark text-golf-green-dark hover:bg-green-50"
          >
            Redigera Profilbild
          </Button>
        </div>
        
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="edit">Redigera Profil</TabsTrigger>
            <TabsTrigger value="preferences">Preferenser</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="bg-white rounded-lg shadow-sm p-6">
            <ProfileForm profile={profile} onSave={handleSaveProfile} />
          </TabsContent>
          
          <TabsContent value="preferences" className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Matchning Preferenser</h3>
              
              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-gray-700 mb-2">Sökradie (km)</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="200" 
                    step="5"
                    value={profile.search_radius_km}
                    onChange={(e) => handlePreferencesChange('search_radius_km', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm">{profile.search_radius_km} km</span>
                    <span className="text-sm text-gray-500">Max 200 km</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-700 mb-2">Max handicap-skillnad</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="54" 
                    step="1"
                    value={profile.max_handicap_difference}
                    onChange={(e) => handlePreferencesChange('max_handicap_difference', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm">±{profile.max_handicap_difference}</span>
                    <span className="text-sm text-gray-500">Max ±54</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="block text-gray-700 mb-2">Åldersintervall</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      min="18" 
                      max="100"
                      value={profile.min_age_preference}
                      onChange={(e) => handlePreferencesChange('min_age_preference', parseInt(e.target.value))}
                      className="w-20 border p-2 rounded"
                    />
                    <span>till</span>
                    <input 
                      type="number" 
                      min="18" 
                      max="100"
                      value={profile.max_age_preference}
                      onChange={(e) => handlePreferencesChange('max_age_preference', parseInt(e.target.value))}
                      className="w-20 border p-2 rounded"
                    />
                    <span>år</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-golf-green-dark hover:bg-golf-green-light mt-4"
                  onClick={handlePreferencesSave}
                >
                  Spara preferenser
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Profile;
