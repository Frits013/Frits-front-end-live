import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", { email });
      // Supabase login logic will be added here
      toast({
        title: "Login functionality coming soon",
        description: "The authentication system is under development.",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log in. Please try again.",
      });
    }
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting signup with:", { email });
      toast({
        title: "Sign up successful!",
        description: "Welcome to Frits. Redirecting to chat...",
      });
      // Simulate successful signup
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign up. Please try again.",
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        background: `
          linear-gradient(
            to bottom,
            rgba(37, 99, 235, 0.1),
            rgba(59, 130, 246, 0.2)
          ),
          url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-blue-900">Frits</h1>
        </div>
        <p className="text-xl text-blue-800">
          Your personal AI assistant, ready to help
        </p>
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="backdrop-blur-md bg-white/80 border border-blue-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-900">Welcome to Frits</CardTitle>
            <CardDescription className="text-blue-700">
              Experience intelligent conversations powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Login
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSignUp}
                  variant="outline"
                  className="flex-1 border-blue-200 hover:bg-blue-50"
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/80 border border-blue-100 shadow-lg">
          <div className="space-y-4 p-6">
            <h3 className="text-2xl font-semibold text-blue-900">Why Choose Frits?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-blue-800">Intelligent conversations tailored to your needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-blue-800">Secure and private communication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-blue-800">24/7 availability for assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span className="text-blue-800">Seamless conversation history tracking</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;