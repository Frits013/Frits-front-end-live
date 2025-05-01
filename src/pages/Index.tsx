import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { AuthContent } from "@/components/auth/AuthContent";
const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    checkEmailConfirmation
  } = useAuthOperations();
  useEffect(() => {
    // Check if user is already logged in and has confirmed email
    const checkUser = async () => {
      try {
        const {
          data: {
            session
          },
          error
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          return;
        }
        if (session) {
          const isConfirmed = await checkEmailConfirmation();
          if (isConfirmed) {
            navigate('/chat');
          } else {
            toast({
              title: "Email Not Confirmed",
              description: "Please check your email and confirm your account before accessing the chat.",
              variant: "destructive",
              duration: 6000
            });
            // Keep on login page if email isn't confirmed
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    checkUser();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' && session) {
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
      }
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out."
        });
      }
      if (event === 'USER_UPDATED') {
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          toast({
            title: "Email Confirmed",
            description: "Your email has been confirmed. Redirecting to chat..."
          });
          navigate('/chat');
        }
      }
    });

    // This is for development purposes only - adds a test company if needed
    const addTestCompany = async () => {
      try {
        // Check if test company already exists
        const {
          data: existingCompany
        } = await supabase.from('companies').select('*').eq('code', 12345678).maybeSingle();
        if (!existingCompany) {
          console.log("Creating test company with code 12345678");
          const {
            data,
            error
          } = await supabase.from('companies').insert({
            code: 12345678,
            company_name: 'Test Company',
            company_description: 'This is a test company for development purposes'
          }).select();
          if (error) {
            console.error("Error creating test company:", error);
          } else {
            console.log("Added test company:", data);
          }
        } else {
          console.log("Test company already exists:", existingCompany);
        }
      } catch (error) {
        console.error("Error in addTestCompany:", error);
      }
    };
    addTestCompany();
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, checkEmailConfirmation]);
  return <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      {/* Company Logo - Positioned at the top left */}
      <div className="absolute top-4 left-4 z-20">
        <img src="/lovable-uploads/aacf68b0-e0c4-472e-9f50-8289a498979b.png" alt="FIDDS Company Emblem" className="h-16 w-auto" />
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
    </div>;
};
export default Index;