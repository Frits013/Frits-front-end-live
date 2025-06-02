
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyInfoMessage {
  info_id: string;
  content_str: string | null;
  content_dict: any;
  created_at: string;
  user_id: string;
}

export interface Company {
  company_id: string;
  company_name: string | null;
  code: number;
  user_count?: number;
}

export const useCompanyInfoMessages = () => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [infoMessages, setInfoMessages] = useState<CompanyInfoMessage[]>([]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('company_id, company_name, code')
        .order('company_name');

      if (error) throw error;

      // Get user count for each company
      const companiesWithUserCount = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.company_id);

          return {
            ...company,
            user_count: count || 0
          };
        })
      );

      setCompanies(companiesWithUserCount);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfoMessagesByCompany = async (companyId: string) => {
    setLoading(true);
    try {
      // First get all users for this company
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id')
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        setInfoMessages([]);
        return;
      }

      const userIds = users.map(user => user.user_id);

      // Then get info messages for these users with category "company"
      const { data: messages, error: messagesError } = await supabase
        .from('info_messages')
        .select('info_id, content_str, content_dict, created_at, user_id')
        .eq('category', 'company')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      setInfoMessages(messages || []);
    } catch (error) {
      console.error('Error fetching info messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    companies,
    infoMessages,
    fetchCompanies,
    fetchInfoMessagesByCompany
  };
};
