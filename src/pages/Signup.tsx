
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Flag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to browse");
      navigate("/browse");
    }
    setAuthInitialized(true);
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Lösenorden matchar inte",
        description: "Se till att båda lösenorden är identiska.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        console.error("Signup error details:", error);
        
        if (error.message?.includes('User already registered')) {
          toast({
            title: "E-postadressen används redan",
            description: "Vänligen använd en annan e-postadress eller logga in istället.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registreringen misslyckades",
            description: error.message || "Ett fel inträffade vid registreringen.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }
      
      toast({
        title: "Konto skapat!",
        description: "Nu kan du slutföra din profil.",
      });
      // Redirect to complete profile instead of login
      navigate("/complete-profile");
    } catch (error: any) {
      console.error("Unexpected signup error:", error);
      toast({
        title: "Ett fel inträffade",
        description: error?.message || "Kunde inte skapa konto. Försök igen senare.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render until auth is initialized to prevent flashing
  if (!authInitialized) {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Flag className="h-12 w-12 text-golf-green-dark" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Skapa konto</h1>
            <p className="mt-2 text-sm text-gray-600">
              Bli medlem i Putt-Pals och hitta din perfekta golfpartner
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="din@email.se"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Lösenord
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Bekräfta lösenord
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-golf-green-dark hover:bg-golf-green-light text-white"
              >
                {loading ? "Skapar konto..." : "Skapa konto"}
              </Button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Har du redan ett konto?{" "}
              <Link to="/login" className="font-medium text-golf-green-dark hover:underline">
                Logga in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
