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

  const addressStorageKey = user?.id ? `si_addresses_${user.id}` : 'si_addresses_guest';

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
    if (useSupabaseAuth) {
      if (!user?.id) {
        setAddresses([]);
        return;
      }

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
      const raw = localStorage.getItem(addressStorageKey);
      if (!raw) {
        setAddresses([]);
        return;
      }
      setAddresses(JSON.parse(raw) as SavedAddress[]);
    } catch {
      setAddresses([]);
    }
  }, [addressStorageKey, user?.id]);

  const persistAddresses = useCallback((nextAddresses: SavedAddress[]) => {
    setAddresses(nextAddresses);
    localStorage.setItem(addressStorageKey, JSON.stringify(nextAddresses));
  }, [addressStorageKey]);

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

    const nextAddress: SavedAddress = {
      id: `${Date.now()}`,
      label,
      address,
      is_default: isDefault,
    };

    const nextAddresses = isDefault
      ? [...addresses.map((entry) => ({ ...entry, is_default: false })), nextAddress]
      : [...addresses, nextAddress];

    persistAddresses(nextAddresses);
    return null;
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

    persistAddresses(addresses.filter((address) => address.id !== id));
    return null;
  };

  const setDefaultAddress = async (id: string) => {
    if (useSupabaseAuth && user?.id) {
      await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', String(user.id));
      await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id);
      await fetchAddresses();
      return;
    }

    persistAddresses(addresses.map((entry) => ({ ...entry, is_default: entry.id === id })));
  };

  return {
    profile, addresses, loading, error,
    updateProfile, addAddress, deleteAddress, setDefaultAddress,
    refresh: fetchProfile,
  };
};
