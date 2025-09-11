import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { Eye, EyeOff, Mail, Lock, Shield, Sparkles, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { validateEmail, validatePassword, sanitizeInput, RateLimiter } from "@/lib/input-validation";
interface CustomLoginFormProps {
  authView: 'sign_in';
}
export const CustomLoginForm = ({
  authView
}: CustomLoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Rate limiter for login attempts
  const rateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
  const {
    toast
  } = useToast();
  const {
    handleEmailSignIn,
    checkEmailConfirmation
  } = useAuthOperations();
  const navigate = useNavigate();
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation and sanitization
    const cleanEmail = sanitizeInput(email.trim(), 254);
    const cleanPassword = password; // Don't sanitize password as it might contain special chars
    
    if (!cleanEmail || !cleanPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }
    
    // Email validation
    if (!validateEmail(cleanEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    
    // Rate limiting check
    if (!rateLimiter.isAllowed(cleanEmail)) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait 5 minutes before trying again.",
        variant: "destructive"
      });
      return;
    }
    
    setPasswordErrors([]);
    setLoading(true);
    try {
      // Attempting authentication - sign in only
      const result = await handleEmailSignIn(cleanEmail, cleanPassword);

      // Check if email is confirmed
      if (result?.data?.user) {
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          setEmailConfirmed(true);
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed. Welcome back!"
          });

          // Navigate to chat page after successful login
          setTimeout(() => {
            navigate('/chat');
          }, 1500);
          return;
        }
      }

      // If sign-in was successful and there was no error
      if (result && !result.error) {
        toast({
          title: "Sign In Successful",
          description: "You've been signed in successfully! Redirecting..."
        });

        // Navigate to chat page after successful login
        setTimeout(() => {
          navigate('/chat');
        }, 1000);
      }

      // Check for errors and handle accordingly
      if (result?.error) {
        console.error("Auth error:", result.error);
        let errorMessage = result.error.message || "An unexpected error occurred";

        // Map specific error codes or messages to more user-friendly messages
        if (errorMessage.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Your email has not been confirmed. Please check your inbox and confirm your email.";
        } else if (errorMessage.includes("User already registered")) {
          errorMessage = "This email is already registered. Please try signing in instead.";
        } else if (errorMessage.includes("fetch") || result.error.name === "FetchError") {
          errorMessage = "Server connection issue. Please try again in a moment.";
        }
        toast({
          title: "Sign In Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);

      // Improved error handling with more specific messages
      let errorMessage = "Authentication failed. Please try again.";
      if (error?.message) {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Server connection issue. Please try again in a moment.";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Your email has not been confirmed. Please check your inbox and confirm your email.";
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <form onSubmit={handleSubmit} className="space-y-5">
      {emailConfirmed && <Alert className="bg-green-50/80 backdrop-blur-sm border-green-200 shadow-sm">
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <AlertDescription className="text-green-800">
            Email confirmed successfully! You're now logged in.
          </AlertDescription>
        </Alert>}
      
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-blue-900">
            Email address
          </Label>
          <div className="relative">
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="pl-10 border-2 focus:ring-2 transition-all duration-200 border-blue-200 focus:border-blue-400 focus:ring-blue-100" required />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-blue-900">
            Password
          </Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="pl-10 pr-10 border-2 focus:ring-2 transition-all duration-200 border-blue-200 focus:border-blue-400 focus:ring-blue-100" required />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced submit button */}
      <Button type="submit" className="w-full py-3 font-medium text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" disabled={loading}>
        {loading ? <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </div> : <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in to continue
          </div>}
      </Button>
    </form>;
};