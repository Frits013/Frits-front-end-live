
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

interface CustomLoginFormProps {
  authView: 'sign_in' | 'sign_up';
}

export const CustomLoginForm = ({ authView }: CustomLoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { handleEmailSignIn, handleEmailSignUp } = useAuthOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Attempting to ${authView === 'sign_in' ? 'sign in' : 'sign up'} with email: ${email}`);
      
      // Clear any previous errors
      let result;
      if (authView === 'sign_in') {
        result = await handleEmailSignIn(email, password);
      } else {
        result = await handleEmailSignUp(email, password);
      }
      
      // Check for errors and handle accordingly
      if (result?.error) {
        console.error("Auth error:", result.error);
        let errorMessage = result.error.message || "An unexpected error occurred";
        
        // Handle network errors more gracefully
        if (errorMessage.includes("fetch") || result.error.name === "FetchError") {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        toast({
          title: authView === 'sign_in' ? "Sign In Failed" : "Sign Up Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
      }
      // Don't set loading to false on success as the page will redirect
      
    } catch (error: any) {
      console.error("Authentication error:", error);
      setLoading(false);
      
      // Improved error handling for network issues
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error?.message) {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="sr-only">Email address</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="pl-10"
            required
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="sr-only">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="pl-10 pr-10"
            required
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
        disabled={loading}
      >
        {loading ? "Processing..." : authView === 'sign_in' ? "Sign in" : "Sign up"}
      </Button>
    </form>
  );
};
