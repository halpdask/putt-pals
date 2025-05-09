
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import GolfBag from "./pages/GolfBag";
import CompleteProfile from "./pages/CompleteProfile";

// Configure the query client with retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Retry failed queries up to 3 times
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
      staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, connectionOk } = useAuth();
  const [isAuthCheck, setIsAuthCheck] = useState(true);
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  
  useEffect(() => {
    // After initial load, set auth check to false
    if (!loading) {
      const timer = setTimeout(() => {
        setIsAuthCheck(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Safety timeout to prevent infinite loading
    const timeoutTimer = setTimeout(() => {
      setAuthCheckTimeout(true);
    }, 10000); // 10 seconds maximum wait
    
    return () => clearTimeout(timeoutTimer);
  }, [loading]);
  
  // If we hit the safety timeout and are still loading, show an error
  if (authCheckTimeout && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Inloggningsproblem</h2>
          <p className="mb-4">Det tar onormalt lång tid att kontrollera din inloggning. Detta kan bero på:</p>
          <ul className="list-disc text-left ml-6 mb-4">
            <li>Tillfälligt serverfel</li>
            <li>Problem med din internetanslutning</li>
            <li>Din webbläsare kan vara för gammal</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Uppdatera sidan
          </button>
        </div>
      </div>
    );
  }
  
  if (loading || isAuthCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golf-green-dark mx-auto mb-4"></div>
          <p className="text-golf-green-dark">Laddar...</p>
        </div>
      </div>
    );
  }
  
  if (!connectionOk) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Anslutningsproblem</h2>
          <p className="mb-4">Det gick inte att ansluta till servern. Detta kan bero på:</p>
          <ul className="list-disc text-left ml-6 mb-4">
            <li>Tillfälligt serverfel</li>
            <li>Problem med din internetanslutning</li>
            <li>Din session har upphört</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Uppdatera sidan
          </button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
      <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/golf-bag" element={<ProtectedRoute><GolfBag /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Add error boundary handling
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Clear any lingering "connection" errors stored in sessionStorage
    try {
      sessionStorage.removeItem('supabase.error.connection');
    } catch (err) {
      console.error('Error accessing sessionStorage:', err);
    }
    
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      
      // Don't show error for expected auth errors when not logged in
      if (event.reason?.message?.includes("AuthProvider")) {
        return;
      }
      
      // Don't crash on "Could not establish connection" errors
      if (event.reason?.message?.includes("Could not establish connection")) {
        console.log("Suppressing 'Could not establish connection' error - likely an extension issue");
        // This error often comes from browser extensions trying to access the page
        return;
      }
      
      toast({
        title: "Ett fel inträffade",
        description: "Uppdatera sidan och försök igen.",
        variant: "destructive",
      });
      setHasError(true);
    };

    // Handle connection errors
    const handleOffline = () => {
      console.log("Connection lost. App is now offline.");
      setIsOffline(true);
      toast({
        title: "Ingen internetanslutning",
        description: "Kontrollera din anslutning och försök igen.",
        variant: "destructive",
      });
    };

    const handleOnline = () => {
      console.log("Connection restored. Refreshing app state...");
      setIsOffline(false);
      toast({
        title: "Anslutningen återställd",
        description: "Du är online igen.",
      });
      
      // Only reload if there was an error
      if (hasError) {
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasError]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
