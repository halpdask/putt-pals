
import { useState } from "react";
import { GolfBall, Settings, LogOut } from "lucide-react";
import Navbar from "../components/Navbar";
import ProfileForm from "../components/ProfileForm";
import { currentUserProfile } from "../data/mockGolfers";
import { GolferProfile } from "../types/golfer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const [profile, setProfile] = useState<GolferProfile>(currentUserProfile);

  const handleSaveProfile = (updatedProfile: GolferProfile) => {
    setProfile(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-golf-green-dark">Min Profil</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
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
                {profile.name[0]}{profile.name.split(' ')[1]?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <div className="flex items-center mt-1 text-gray-600">
                <GolfBall className="w-4 h-4 mr-1" />
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
              <p className="text-gray-500">Funktionen kommer snart...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Navbar />
    </div>
  );
};

export default Profile;
