import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Branch } from '../types';
import localBranchData from '../data/branches.json';

const SUPABASE_READY =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (!SUPABASE_READY) {
        setBranches((localBranchData as Branch[]).filter((branch) => branch.name.toLowerCase() === 'mathur'));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('id', { ascending: true });

      if (error || !data?.length) {
        setBranches((localBranchData as Branch[]).filter((branch) => branch.name.toLowerCase() === 'mathur'));
        if (error) setError(error.message);
      } else {
        setBranches(
          data.filter(row => String(row.name).toLowerCase() === 'mathur').map(row => ({
            id: row.id,
            name: row.name,
            address: row.address,
            phone: row.phone,
            hours: row.hours,
            imageUrl: row.image_url,
            mapUrl: row.map_url,
            isFlagship: row.is_flagship,
          }))
        );
      }
      setLoading(false);
    };

    load();
  }, []);

  return { branches, loading, error };
};
