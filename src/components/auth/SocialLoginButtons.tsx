
import React from "react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useAuthOperations } from "@/hooks/use-auth-operations";

export const SocialLoginButtons = () => {
  const { handleSignInWithGithub } = useAuthOperations();
  
  return (
    <>
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
  );
};
