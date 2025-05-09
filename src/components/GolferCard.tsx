
import { useState } from "react";
import { Heart, X, Info } from "lucide-react";
import { GolferProfile } from "../types/golfer";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GolferCardProps {
  golfer: GolferProfile;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  disabled?: boolean; // Added disabled prop as optional
}

const GolferCard = ({ golfer, onLike, onDislike, disabled = false }: GolferCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="golf-card h-[70vh] max-h-[600px] w-full max-w-md mx-auto bg-white">
      <div className="relative h-full w-full">
        <img 
          src={golfer.profileImage} 
          alt={golfer.name}
          className="w-full h-2/3 object-cover"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-white p-4 h-1/3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{golfer.name}, {golfer.age}</h2>
              <p className="text-gray-600">{golfer.location}</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-2 text-golf-green-dark hover:text-golf-green-light transition-colors">
                  <Info size={24} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{golfer.name} Profil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex flex-col gap-2">
                    <p><span className="font-semibold">Ålder:</span> {golfer.age} år</p>
                    <p><span className="font-semibold">Handicap:</span> {golfer.handicap}</p>
                    <p><span className="font-semibold">Hemmaklubb:</span> {golfer.homeCourse}</p>
                    <p><span className="font-semibold">Om mig:</span> {golfer.bio}</p>
                    
                    <div>
                      <p className="font-semibold mb-1">Söker rundor:</p>
                      <div className="flex flex-wrap gap-2">
                        {golfer.roundTypes.map((type) => (
                          <Badge key={type} variant="outline" className="bg-golf-fairway text-golf-green-dark">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1">Tillgänglig:</p>
                      <div className="flex flex-wrap gap-2">
                        {golfer.availability.map((time) => (
                          <Badge key={time} variant="outline">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Hcp:</span>
              <span>{golfer.handicap}</span>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {golfer.roundTypes.slice(0, 2).map((type) => (
                <Badge key={type} variant="outline" className="bg-golf-fairway text-golf-green-dark">
                  {type}
                </Badge>
              ))}
              {golfer.roundTypes.length > 2 && (
                <Badge variant="outline">+{golfer.roundTypes.length - 2}</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-12">
          <button 
            className="swipe-button bg-red-50 text-red-500"
            onClick={() => onDislike(golfer.id)}
            disabled={disabled}
          >
            <X size={28} />
          </button>
          
          <button 
            className="swipe-button bg-green-50 text-golf-green-dark"
            onClick={() => onLike(golfer.id)}
            disabled={disabled}
          >
            <Heart size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GolferCard;
