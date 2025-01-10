import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Frits</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Your personal AI assistant, ready to help
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="p-2">
          <CardHeader>
            <CardTitle>Welcome to Frits</CardTitle>
            <CardDescription>
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
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="p-6 flex flex-col justify-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Why Choose Frits?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Intelligent conversations tailored to your needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Secure and private communication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>24/7 availability for assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Seamless conversation history tracking</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;