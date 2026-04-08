import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/**
 * Restores any existing Supabase session on mount and keeps the Zustand
 * session in sync via onAuthStateChange for the lifetime of the app.
 */
export function useAuthListener(): void {
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);
}
