
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContent } from "@/components/auth/AuthContent";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const authCheckingRef = useRef(false);
  const [emailJustConfirmed, setEmailJustConfirmed] = useState(false);

  // Simplified auth checking that runs once on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckingRef.current) return;
      authCheckingRef.current = true;
      
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if we have a hash fragment in the URL that indicates email confirmation
        const urlHash = window.location.hash;
        const hasEmailConfirmParam = urlHash.includes('email_confirmed=true') || 
                                    urlHash.includes('type=signup') || 
                                    urlHash.includes('type=recovery');
        
        if (hasEmailConfirmParam) {
          console.log("Email confirmation detected in URL");
          setEmailJustConfirmed(true);
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed! You can now sign in.",
          });
          // Clear the hash fragment from the URL
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
          }, 500);
        }
        
        if (session) {
          // If we have a session, let's check if the email is confirmed
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.email_confirmed_at) {
            // Email is confirmed, navigate to chat
            navigate('/chat');
            return; // Exit early
          }
          
          // If email isn't confirmed, we'll stay on the login page
          // Sign out to ensure clean state
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
        authCheckingRef.current = false;
      }
    };
    
    // Run the auth check
    checkAuth();
    
    // Listen for auth state changes to handle navigation correctly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          // Email confirmed, navigate to chat
          navigate('/chat');
        }
      } else if (event === 'USER_UPDATED') {
        // User was updated, which might happen after email confirmation
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setEmailJustConfirmed(true);
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed! You can now sign in.",
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative" 
      style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Company Logo - Positioned at the top left */}
      <div className="absolute top-4 left-4 z-20">
        <img 
          src="/lovable-uploads/aacf68b0-e0c4-472e-9f50-8289a498979b.png" 
          alt="FIDDS Company Emblem" 
          className="h-16 w-auto" 
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-900">Frits the AI readiness consultant</h1>
        </div>

        {emailJustConfirmed && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800">
              Email confirmed successfully! You can now sign in.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6 shadow-md bg-white border-0">
          <AuthContent />
        </Card>
      </div>
    </div>
  );
};

export default Index;
