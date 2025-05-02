
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContent } from "@/components/auth/AuthContent";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const authCheckingRef = useRef(false);

  // Simplified auth checking that runs once on component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckingRef.current) return;
      authCheckingRef.current = true;
      
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
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
      if (event === 'SIGNED_IN' && session) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          // Email confirmed, navigate to chat
          navigate('/chat');
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

        <Card className="p-6 shadow-md bg-white border-0">
          <AuthContent />
        </Card>
      </div>
    </div>
  );
};

export default Index;
