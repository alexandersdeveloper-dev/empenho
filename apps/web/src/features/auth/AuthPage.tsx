import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuthStore } from '@/shared/lib/authStore';
import { apiClient } from '@/shared/lib/apiClient';
import { LoginSchema, type LoginDto } from '@ficha-empenho/shared';

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (!session.session) throw new Error('Login falhou');

      // Busca perfil via API
      const res = await apiClient.get('/users/me').catch(async () => {
        const { data: p } = await supabase
          .from('perfis')
          .select('*, departamento:departamentos(id,nome,sigla)')
          .eq('id', session.session!.user.id)
          .single();
        return { data: { ...p, email: session.session!.user.email } };
      });

      setUser(res.data);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-700">Fichas de Empenho</h1>
          <p className="text-sm text-gray-500 mt-1">Prefeitura Municipal de Parintins</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              placeholder="usuario@parintins.am.gov.br"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-brand-600 text-white py-2.5 font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
