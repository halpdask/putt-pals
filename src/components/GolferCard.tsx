
import { useState, useRef, useEffect } from "react";
import { Heart, X, Info } from "lucide-react";
import { GolferProfile } from "../types/golfer";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

interface GolferCardProps {
  golfer: GolferProfile;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  disabled?: boolean;
}

const GolferCard = ({ golfer, onLike, onDislike, disabled = false }: GolferCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Swipe functionality
  const cardRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeComplete, setSwipeComplete] = useState(false);
  
  // Reset card position after animation completes
  useEffect(() => {
    if (swipeComplete) {
      // Allow animation to play before resetting
      const timer = setTimeout(() => {
        setCurrentX(0);
        setSwipeDirection(null);
        setSwipeComplete(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [swipeComplete]);
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    setStartX(clientX);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    const deltaX = clientX - startX;
    setCurrentX(deltaX);
    
    // Determine swipe direction for visual feedback
    if (deltaX > 40) {
      setSwipeDirection('right');
    } else if (deltaX < -40) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    // Threshold for triggering a swipe action
    const SWIPE_THRESHOLD = 100;
    
    if (currentX > SWIPE_THRESHOLD) {
      // Swipe right - like
      setSwipeComplete(true);
      onLike(golfer.id);
    } else if (currentX < -SWIPE_THRESHOLD) {
      // Swipe left - dislike
      setSwipeComplete(true);
      onDislike(golfer.id);
    } else {
      // Reset if the swipe wasn't big enough
      setCurrentX(0);
      setSwipeDirection(null);
    }
  };
  
  // Calculate transform style based on currentX position
  const getCardStyle = () => {
    if (currentX === 0) return {};
    
    const rotate = currentX * 0.1; // Slight rotation for natural feel
    return {
      transform: `translateX(${currentX}px) rotate(${rotate}deg)`,
      transition: swipeComplete ? 'transform 0.3s ease-out' : '',
    };
  };

  return (
    <div className="golf-card h-[70vh] max-h-[600px] w-full max-w-md mx-auto bg-white relative">
      <div 
        ref={cardRef}
        className="relative h-full w-full touch-none cursor-grab active:cursor-grabbing"
        style={getCardStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <Card className="overflow-hidden h-full shadow-lg">
          <img 
            src={golfer.profileImage} 
            alt={golfer.name}
            className="w-full h-2/3 object-cover"
          />
          
          {/* Swipe overlay indicators */}
          {swipeDirection === 'right' && (
            <div className="absolute top-4 left-4 bg-green-500 text-white py-1 px-4 rounded-full opacity-90 shadow-lg transform rotate-[-15deg] scale-110">
              <span className="text-lg font-bold flex items-center">
                <Heart className="mr-1" size={20} /> GILLAR
              </span>
            </div>
          )}
          
          {swipeDirection === 'left' && (
            <div className="absolute top-4 right-4 bg-red-500 text-white py-1 px-4 rounded-full opacity-90 shadow-lg transform rotate-[15deg] scale-110">
              <span className="text-lg font-bold flex items-center">
                <X className="mr-1" size={20} /> NEKAR
              </span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-white p-4 h-1/3 flex flex-col">
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
            
            <div className="mt-2 flex-grow">
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
        </Card>
        
        {/* Swipe instructions - shown only initially */}
        <div className="swipe-hint absolute top-1/2 left-0 right-0 transform -translate-y-1/2 text-center text-white text-xl opacity-80 pointer-events-none">
          <p className="bg-black bg-opacity-40 p-2 rounded mx-auto inline-block shadow-lg">
            Svep <span className="text-red-300">vänster</span> för att neka 
            <br />
            Svep <span className="text-green-300">höger</span> för att gilla
          </p>
        </div>
      </div>
    </div>
  );
};

export default GolferCard;
