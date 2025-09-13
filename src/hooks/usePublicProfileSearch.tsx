import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  job_title: string;
  website_url: string;
  skills: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
  ai_processed: boolean;
  profile_completeness: number;
}

export const usePublicProfileSearch = () => {
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProfiles = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('search_public_profiles', {
        search_term: searchTerm
      });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('search error:', err);
      setError('failed to search profiles');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    loading,
    error,
    searchProfiles,
    clearResults
  };
};