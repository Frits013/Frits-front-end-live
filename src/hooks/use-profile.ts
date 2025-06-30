
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
          // Get the company code from companies table
          const { data: company } = await supabase
            .from('companies')
            .select('code')
            .eq('company_id', profile.company_id)
            .maybeSingle();
            
          if (company) {
            setCompanyCode(company.code.toString().padStart(8, '0'));
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

      // If editing company code, handle it specially
      if (isEditingCode) {
        const isValid = await validateCompanyCode(companyCode);
        if (!isValid) {
          setIsLoading(false);
          return false;
        }

        if (companyCode) {
          // First check if the company code exists in company_codes table
          const { data: validCode } = await supabase
            .from('company_codes')
            .select('code')
            .eq('code', parseInt(companyCode))
            .maybeSingle();

          if (!validCode) {
            setCodeError("Company code not found");
            setIsLoading(false);
            return false;
          }

          // Use the RPC function to set the company
          const { data: success, error: functionError } = await supabase
            .rpc('set_user_company', {
              user_uuid: session.user.id,
              company_code: companyCode
            });

          if (functionError) {
            console.error("Function error:", functionError);
            toast({
              title: "Error",
              description: "Failed to update company code",
              variant: "destructive",
            });
            setIsLoading(false);
            return false;
          }
          
          if (!success) {
            setCodeError("Failed to link company code");
            setIsLoading(false);
            return false;
          }

          toast({
            title: "Success",
            description: "Company code updated successfully",
          });
        } else {
          // Clear company code by setting company_id to null
          const { error: updateError } = await supabase
            .from("users")
            .update({ company_id: null })
            .eq("user_id", session.user.id);

          if (updateError) {
            console.error("Error clearing company:", updateError);
            toast({
              title: "Error",
              description: "Failed to clear company code",
              variant: "destructive",
            });
            setIsLoading(false);
            return false;
          }

          toast({
            title: "Success",
            description: "Company code cleared successfully",
          });
        }
        
        setIsLoading(false);
        return true;
      }

      // Update other profile fields (user description and TTS flag)
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
