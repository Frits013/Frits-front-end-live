
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  const [companyCode, setCompanyCode] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const { toast } = useToast();

  const validateCompanyCode = async (code: string) => {
    if (!code) return true; // Empty code is allowed
    
    // Check if code is exactly 8 digits
    if (!/^\d{8}$/.test(code)) {
      setCodeError("Company code must be exactly 8 digits");
      return false;
    }
    
    setCodeError("");
    
    const numericCode = parseInt(code);
    const { data: validCode } = await supabase
      .from('company_codes')
      .select('code')
      .eq('code', numericCode)
      .maybeSingle();

    if (!validCode) {
      setCodeError("Company code not found");
      return false;
    }
    
    return true;
  };

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await supabase
        .from("users")
        .select(`
          user_description,
          TTS_flag,
          company_id
        `)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setUserDescription(profile.user_description || "");
        setTtsEnabled(profile.TTS_flag || false);
        
        if (profile.company_id) {
          const { data: companyCode } = await supabase
            .from('company_codes')
            .select('code')
            .eq('code', profile.company_id)
            .maybeSingle();
            
          if (companyCode) {
            setCompanyCode(companyCode.code.toString().padStart(8, '0'));
          } else {
            setCompanyCode("");
          }
        } else {
          setCompanyCode("");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const saveProfile = async (isEditingCode: boolean) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      // If editing company code, validate it first
      if (isEditingCode) {
        const isValid = await validateCompanyCode(companyCode);
        if (!isValid) {
          setIsLoading(false);
          return false;
        }

        // Update company code
        if (companyCode) {
          const { data: success, error: functionError } = await supabase
            .rpc('set_user_company', {
              user_uuid: session.user.id,
              company_code: companyCode
            });

          if (functionError) {
            console.error("Function error:", functionError);
            throw functionError;
          }
          
          if (!success) {
            setCodeError("Failed to link company code");
            setIsLoading(false);
            return false;
          }
        } else {
          // Clear company code
          const { error: updateError } = await supabase
            .from("users")
            .update({ company_id: null })
            .eq("user_id", session.user.id);

          if (updateError) throw updateError;
        }
      }

      // Update other profile fields
      const { error } = await supabase
        .from("users")
        .update({
          user_description: userDescription,
          TTS_flag: ttsEnabled
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    companyCode,
    setCompanyCode,
    userDescription,
    setUserDescription,
    ttsEnabled,
    setTtsEnabled,
    isLoading,
    codeError,
    setCodeError,
    loadProfile,
    saveProfile,
  };
};
