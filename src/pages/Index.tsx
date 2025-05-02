
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { AuthContent } from "@/components/auth/AuthContent";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkEmailConfirmation } = useAuthOperations();
  const [isChecking, setIsChecking] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Check if user is already logged in and has confirmed email
    const checkUser = async () => {
      // Skip if already checking or check completed
      if (checkingRef.current || authCheckCompleted) return;
      
      checkingRef.current = true;
      setIsChecking(true);
      
      try {
        console.log("Checking user session");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          setIsChecking(false);
          checkingRef.current = false;
          setAuthCheckCompleted(true);
          return;
        }
        
        if (session) {
          console.log("User has an active session, checking email confirmation");
          const isConfirmed = await checkEmailConfirmation();
          if (isConfirmed) {
            console.log("Email confirmed, redirecting to chat");
            navigate('/chat');
          } else {
            console.log("Email not confirmed, signing out");
            toast({
              title: "Email Not Confirmed",
              description: "Please check your email and confirm your account before accessing the chat.",
              variant: "destructive",
              duration: 6000
            });
            // Keep on login page if email isn't confirmed
            await supabase.auth.signOut();
          }
        } else {
          console.log("No active session found");
        }
        
        setIsChecking(false);
        checkingRef.current = false;
        setAuthCheckCompleted(true);
      } catch (error) {
        console.error("Auth error:", error);
        setIsChecking(false);
        checkingRef.current = false;
        setAuthCheckCompleted(true);
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      // Skip duplicate checks if currently checking
      if (checkingRef.current) return;
      
      if (event === 'SIGNED_IN' && session) {
        checkingRef.current = true;
        setIsChecking(true);
        
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          toast({
            title: "Welcome!",
            description: "Successfully signed in. Redirecting to chat..."
          });
          navigate('/chat');
        } else {
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and confirm your account before accessing the chat.",
            variant: "destructive",
            duration: 6000
          });
          await supabase.auth.signOut();
        }
        
        setIsChecking(false);
        checkingRef.current = false;
      }
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out."
        });
      }
      
      if (event === 'USER_UPDATED') {
        // Skip if already checking
        if (checkingRef.current) return;
        
        checkingRef.current = true;
        setIsChecking(true);
        
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          toast({
            title: "Email Confirmed",
            description: "Your email has been confirmed. Redirecting to chat..."
          });
          navigate('/chat');
        }
        
        setIsChecking(false);
        checkingRef.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, checkEmailConfirmation, authCheckCompleted]);

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
