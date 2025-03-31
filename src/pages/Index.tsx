
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flag, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 text-golf-green-dark animate-swing">
          <Flag size={64} />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-golf-green-dark">Putt-Pals</h1>
        <p className="text-xl text-gray-700 mb-8 max-w-md">
          Matcha med andra golfare och hitta din perfekta golfpartner i Sverige
        </p>
        
        <div className="grid gap-4 w-full max-w-xs">
          <Link to="/browse">
            <Button 
              className="w-full bg-golf-green-dark hover:bg-golf-green-light text-white p-6"
              size="lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Börja Matcha
            </Button>
          </Link>
          
          <Link to="/profile">
            <Button 
              variant="outline" 
              className="w-full border-golf-green-dark text-golf-green-dark hover:bg-green-50 p-6"
              size="lg"
            >
              Skapa Din Profil
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="p-6 text-center text-gray-500">
        <p>Hitta någon att dela din nästa runda med</p>
      </div>
    </div>
  );
};

export default Index;
