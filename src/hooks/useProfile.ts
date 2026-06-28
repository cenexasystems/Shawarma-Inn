import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSupabaseAuth } from '../lib/runtime';
import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string | number;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string | null;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
}

export const useProfile = () => {
  const { user, token, updateProfile: updateAuthProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id || !token) {
      setProfile(null);
      return;
    }

    setLoading(true);

    try {
      if (useSupabaseAuth) {
        setProfile({
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          status: user.status,
        });
      } else {
        const response = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load profile');
        }

        setProfile(payload.profile as Profile);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }

    setLoading(false);
  }, [user?.id, token]);

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) {
      setAddresses([]);
      return;
    }

    if (useSupabaseAuth) {
      const { data, error: supabaseError } = await supabase
        .from('saved_addresses')
        .select('id, label, address, is_default')
        .eq('user_id', String(user.id))
        .order('created_at', { ascending: true });

      if (supabaseError) {
        setAddresses([]);
        return;
      }

      setAddresses((data || []) as SavedAddress[]);
      return;
    }

    try {
      const response = await fetch('/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) { setAddresses([]); return; }
      const payload = await response.json() as { addresses: Array<{ id: number; label: string; address_line: string; is_default: number }> };
      setAddresses(
        (payload.addresses || []).map((a) => ({
          id: String(a.id),
          label: a.label,
          address: a.address_line,
          is_default: Boolean(a.is_default),
        }))
      );
    } catch {
      setAddresses([]);
    }
  }, [user?.id, token]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user?.id, fetchProfile, fetchAddresses]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'phone' | 'avatar_url' | 'status'>>) => {
    const updatedUser = await updateAuthProfile({
      name: updates.name ?? undefined,
      phone: updates.phone ?? undefined,
      avatar_url: updates.avatar_url ?? undefined,
      status: updates.status ?? undefined,
    });
    setProfile({
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      avatar_url: updatedUser.avatar_url,
      status: updatedUser.status,
    });
    return null;
  };

  const addAddress = async (label: string, address: string, isDefault = false) => {
    if (useSupabaseAuth && user?.id) {
      if (isDefault) {
        await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', String(user.id));
      }

      const { error: supabaseError } = await supabase
        .from('saved_addresses')
        .insert({ user_id: String(user.id), label, address, is_default: isDefault })
        .select('id, label, address, is_default')
        .single();

      if (supabaseError) {
        return supabaseError.message;
      }

      await fetchAddresses();
      return null;
    }

    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label, address_line: address, is_default: isDefault }),
      });
      const payload = await response.json();
      if (!response.ok) return (payload as { error?: string }).error || 'Failed to save address.';
      await fetchAddresses();
      return null;
    } catch {
      return 'Failed to save address.';
    }
  };

  const deleteAddress = async (id: string) => {
    if (useSupabaseAuth && user?.id) {
      const { error: supabaseError } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', String(user.id));

      if (supabaseError) {
        return supabaseError.message;
      }

      await fetchAddresses();
      return null;
    }

    try {
      const response = await fetch(`/api/users/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json();
        return (payload as { error?: string }).error || 'Failed to delete address.';
      }
      await fetchAddresses();
      return null;
    } catch {
      return 'Failed to delete address.';
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (useSupabaseAuth && user?.id) {
      await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', String(user.id));
      await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id);
      await fetchAddresses();
      return;
    }

    try {
      await fetch(`/api/users/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAddresses();
    } catch {
      // non-fatal
    }
  };

  return {
    profile, addresses, loading, error,
    updateProfile, addAddress, deleteAddress, setDefaultAddress,
    refresh: fetchProfile,
  };
};
