
import { Link, useLocation } from "react-router-dom";
import { Search, User, MessageSquare, Home, Flag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white py-2 z-10 shadow-lg">
      <div className="container mx-auto flex items-center justify-around">
        <NavLink 
          to="/browse" 
          icon={<Search />}
          label="Sök"
          isActive={location.pathname === '/browse'}
          isMobile={isMobile}
        />
        
        <NavLink 
          to="/matches" 
          icon={<MessageSquare />}
          label="Matchningar"
          isActive={location.pathname === '/matches'}
          isMobile={isMobile}
        />

        <NavLink 
          to="/golf-bag" 
          icon={<Flag />}
          label="Golfbag"
          isActive={location.pathname === '/golf-bag'}
          isMobile={isMobile}
        />
        
        <NavLink 
          to="/profile" 
          icon={<User />}
          label="Profil"
          isActive={location.pathname === '/profile'}
          isMobile={isMobile}
        />
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile: boolean;
}

const NavLink = ({ to, icon, label, isActive, isMobile }: NavLinkProps) => {
  const activeClass = isActive ? 
    "text-golf-green-dark bg-green-50 border-t-2 border-golf-green-dark" : 
    "text-gray-500 hover:text-golf-green-dark";
  
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center rounded-md px-3 py-2 transition-colors ${activeClass} ${isMobile ? 'flex-1' : 'px-5'}`}
    >
      <div className={`w-6 h-6 ${isActive ? 'text-golf-green-dark' : ''}`}>
        {icon}
      </div>
      <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>{label}</span>
    </Link>
  );
};

export default Navbar;
