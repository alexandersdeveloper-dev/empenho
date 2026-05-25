import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuthStore } from '@/shared/lib/authStore';
import { AuthPage } from '@/features/auth/AuthPage';
import { MainLayout } from './MainLayout';

export function App() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const { data: p } = await supabase
            .from('perfis')
            .select('*, departamento:departamentos(id,nome,sigla)')
            .eq('id', data.session.user.id)
            .single();
          setUser({ ...p, email: data.session.user.email });
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    // Escuta mudanças de auth (login/logout/refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <MainLayout />;
}
