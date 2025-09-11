import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContent } from "@/components/auth/AuthContent";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();

        // Check if we have a hash fragment in the URL that indicates email confirmation
        const urlHash = window.location.hash;
        const hasEmailConfirmParam = urlHash.includes('email_confirmed=true') || urlHash.includes('type=signup') || urlHash.includes('type=recovery');
        if (hasEmailConfirmParam) {
          console.log("Email confirmation detected in URL");
          setEmailJustConfirmed(true);
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed! You can now sign in."
          });
          // Clear the hash fragment from the URL
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
          }, 500);
        }
        if (session) {
          // If we have a session, let's check if the email is confirmed
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();
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
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' && session) {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          // Email confirmed, navigate to chat
          navigate('/chat');
        }
      } else if (event === 'USER_UPDATED') {
        // User was updated, which might happen after email confirmation
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setEmailJustConfirmed(true);
          toast({
            title: "Email Confirmed",
            description: "Your email has been successfully confirmed! You can now sign in."
          });
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with animated gradient */}
      <div className="absolute inset-0" style={{
      background: `
            linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 25%, rgba(236, 72, 153, 0.1) 50%, rgba(59, 130, 246, 0.1) 75%, rgba(16, 185, 129, 0.1) 100%),
            url("https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80")
          `,
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
      backgroundRepeat: 'no-repeat, no-repeat'
    }} />
      
      {/* Floating geometric shapes for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-indigo-200/40 rounded-full blur-lg animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-pink-200/30 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Company Logo - Enhanced positioning */}
      <div className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
        <img src="/lovable-uploads/aacf68b0-e0c4-472e-9f50-8289a498979b.png" alt="FIDDS Company Emblem" className="h-12 w-auto" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Enhanced Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <MessageSquare className="h-10 w-10 text-blue-600" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Frits AI
              </h1>
            </div>
            <p className="text-lg text-gray-700 mb-2 font-medium">
              Your AI Readiness Consultant
            </p>
            
          </div>

          {emailJustConfirmed && <Alert className="mb-6 bg-green-50/80 backdrop-blur-sm border-green-200 shadow-lg">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-800">
                Email confirmed successfully! You can now sign in.
              </AlertDescription>
            </Alert>}

          {/* Enhanced Card with glassmorphism effect */}
          <Card className="p-8 shadow-2xl bg-white/80 backdrop-blur-md border-0 relative overflow-hidden">
            {/* Subtle gradient overlay on card */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <AuthContent />
            </div>
          </Card>
          
          {/* Trust indicators */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Trusted by innovative businesses worldwide</p>
            <div className="flex justify-center items-center gap-4 opacity-60">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Secure</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Reliable</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">Intelligent</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;