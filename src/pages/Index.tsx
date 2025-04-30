
import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useAuthOperations } from "@/hooks/use-auth-operations";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleSignInWithGithub, handleEmailSignUp } = useAuthOperations();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        setIsCheckingSession(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          return;
        }

        if (session) {
          // Check if the user's email is confirmed before redirecting to chat
          const user = session.user;
          if (user && user.email_confirmed_at) {
            navigate('/chat');
          } else {
            // If email not confirmed, sign them out and show message
            await supabase.auth.signOut();
            toast({
              title: "Email Not Confirmed",
              description: "Please check your email and confirm your account before signing in.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        // Check if email is confirmed before redirecting
        const user = session.user;
        if (user && user.email_confirmed_at) {
          toast({
            title: "Welcome!",
            description: "Successfully signed in. Redirecting to chat...",
          });
          navigate('/chat');
        } else {
          // If email not confirmed, sign them out and show message
          await supabase.auth.signOut();
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and confirm your account before signing in.",
            variant: "destructive",
          });
        }
      }

      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out.",
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const toggleAuthView = () => {
    setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in');
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
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-blue-900">Frits</h1>
        </div>

        <Card className="p-6 backdrop-blur-md bg-white/80 border border-blue-100 shadow-lg">
          {isCheckingSession ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#3b82f6',
                        brandAccent: '#2563eb',
                      },
                    },
                  },
                }}
                providers={[]}
                view={authView}
              />
              
              <Button 
                variant="outline" 
                className="w-full bg-white text-blue-600 border-blue-200 hover:bg-blue-50 mt-2"
                onClick={toggleAuthView}
              >
                {authView === 'sign_in' ? 'Sign up' : 'Sign in'}
              </Button>
              
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/80 text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={handleSignInWithGithub}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
