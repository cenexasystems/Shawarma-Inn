import React from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useSupabaseAuth } from '../../lib/runtime';

interface CustomerDetailsFormProps {
  isCustomerLoggedIn: boolean;
  user: any;
  logout: () => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authName: string;
  setAuthName: (name: string) => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  showAuthPassword: boolean;
  setShowAuthPassword: React.Dispatch<React.SetStateAction<boolean>>;
  authError: string;
  authSaving: boolean;
  handleCheckoutAuth: () => void;
  handleGoogleCheckoutAuth: (cred: CredentialResponse) => void;
}

export default function CustomerDetailsForm({
  isCustomerLoggedIn,
  user,
  logout,
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  showAuthPassword,
  setShowAuthPassword,
  authError,
  authSaving,
  handleCheckoutAuth,
  handleGoogleCheckoutAuth
}: CustomerDetailsFormProps) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-[24px] p-4 sm:p-6 shadow-2xl">
      <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-[var(--red)]/10 flex items-center justify-center text-[var(--red)]">1</span>
        Account
      </h2>
      
      {isCustomerLoggedIn ? (
        <div className="flex flex-wrap items-center gap-3 justify-between bg-black/40 border border-white/5 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <p className="font-bold text-white font-body">{user.name || 'Customer'}</p>
              <p className="text-xs text-white/50 break-all">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="text-[10px] font-bold uppercase tracking-[2px] text-white/40 hover:text-[var(--red)] transition-colors">
            Switch
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="flex bg-black p-1 rounded-full border border-white/5 mb-6 max-w-xs mx-auto md:mx-0">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
            >
              Sign Up
            </button>
          </div>
          
          {useSupabaseAuth && (
            <div className="mb-6">
              <GoogleLogin
                onSuccess={handleGoogleCheckoutAuth}
                onError={() => handleGoogleCheckoutAuth({} as any)}
                shape="pill" text="continue_with" theme="filled_black" width="100%"
              />
              <div className="flex items-center gap-2 mt-5">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[2px] text-white/30">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authMode === 'signup' && (
              <input 
                type="text" 
                value={authName} 
                onChange={(e) => setAuthName(e.target.value)} 
                placeholder="Full Name" 
              className="w-full min-h-12 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[var(--red)] transition-all font-body md:col-span-2"
              />
            )}
            <input 
              type="email" 
              value={authEmail} 
              onChange={(e) => setAuthEmail(e.target.value)} 
              placeholder="Email Address" 
              className="w-full min-h-12 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[var(--red)] transition-all font-body"
            />
            <div className="relative">
              <input 
                type={showAuthPassword ? 'text' : 'password'} 
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)} 
                placeholder="Password" 
                className="w-full min-h-12 bg-black/40 border border-white/5 rounded-2xl p-4 pr-12 text-sm outline-none focus:border-[var(--red)] transition-all font-body"
              />
              <button 
                type="button" 
                onClick={() => setShowAuthPassword(v => !v)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              >
                {showAuthPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
          {authError && <p className="text-xs text-red-400 mt-4 text-center">{authError}</p>}
          <button 
            onClick={handleCheckoutAuth} 
            disabled={authSaving} 
            className="w-full mt-5 bg-[var(--red)] text-white font-bebas text-lg py-3.5 rounded-2xl tracking-[2px] uppercase disabled:opacity-40 hover:scale-[1.01] transition-all"
          >
            {authSaving ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Sign in to continue'}
          </button>
        </div>
      )}
    </div>
  );
}
