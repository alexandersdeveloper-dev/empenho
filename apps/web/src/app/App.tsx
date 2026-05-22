import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuthStore } from '@/shared/lib/authStore';
import { apiClient } from '@/shared/lib/apiClient';
import { AuthPage } from '@/features/auth/AuthPage';
import { MainLayout } from './MainLayout';

export function App() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const { data: perfil } = await apiClient.get('/users/me').catch(async () => {
            // fallback: busca perfil via Supabase diretamente
            const { data: p } = await supabase
              .from('perfis')
              .select('*, departamento:departamentos(id,nome,sigla)')
              .eq('id', data.session!.user.id)
              .single();
            return { data: { ...p, email: data.session!.user.email } };
          });
          setUser(perfil);
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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <MainLayout />;
}
