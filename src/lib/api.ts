export interface AuthUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string | null;
  provider: string | null;
  is_profile_complete: boolean;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '/api';

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (payload as { error?: string }).error || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export const authApi = {
  signup: (input: { email: string; password: string; name?: string }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/signup', {
      method: 'POST',
      body: input,
    }),
  login: (input: { email: string; password: string }) =>
    apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: input,
    }),
  adminLogin: (input: { email: string; password: string }) =>
    apiRequest<{ token: string; user: AuthUser }>('/admin/login', {
      method: 'POST',
      body: input,
    }),
  me: (token: string) =>
    apiRequest<{ user: AuthUser }>('/auth/me', {
      token,
    }),
};

export const profileApi = {
  get: (token: string) =>
    apiRequest<{ profile: AuthUser }>('/users/profile', {
      token,
    }),
  update: (
    token: string,
    updates: {
      name?: string;
      phone?: string;
      avatar_url?: string;
      status?: string;
    },
  ) =>
    apiRequest<{ profile: AuthUser; user: AuthUser }>('/users/profile', {
      method: 'PUT',
      token,
      body: updates,
    }),
};
