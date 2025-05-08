
import { Link, useLocation } from "react-router-dom";
import { Search, User, MessageSquare, Home, Flag } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white py-2 z-10">
      <div className="container mx-auto flex items-center justify-around">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : 'text-gray-500'}`}
        >
          <Home className={`w-6 h-6 ${location.pathname === '/' ? 'text-golf-green-dark' : 'text-gray-500'}`} />
          <span>Hem</span>
        </Link>
        
        <Link 
          to="/browse" 
          className={`nav-link ${location.pathname === '/browse' ? 'active' : 'text-gray-500'}`}
        >
          <Search className={`w-6 h-6 ${location.pathname === '/browse' ? 'text-golf-green-dark' : 'text-gray-500'}`} />
          <span>Sök</span>
        </Link>
        
        <Link 
          to="/matches" 
          className={`nav-link ${location.pathname === '/matches' ? 'active' : 'text-gray-500'}`}
        >
          <MessageSquare className={`w-6 h-6 ${location.pathname === '/matches' ? 'text-golf-green-dark' : 'text-gray-500'}`} />
          <span>Matchningar</span>
        </Link>

        <Link 
          to="/golf-bag" 
          className={`nav-link ${location.pathname === '/golf-bag' ? 'active' : 'text-gray-500'}`}
        >
          <Flag className={`w-6 h-6 ${location.pathname === '/golf-bag' ? 'text-golf-green-dark' : 'text-gray-500'}`} />
          <span>Golfbag</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`nav-link ${location.pathname === '/profile' ? 'active' : 'text-gray-500'}`}
        >
          <User className={`w-6 h-6 ${location.pathname === '/profile' ? 'text-golf-green-dark' : 'text-gray-500'}`} />
          <span>Profil</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
