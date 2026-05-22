import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class AuthService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw new UnauthorizedException('Credenciais inválidas');

    const { data: perfil } = await this.supabase
      .from('perfis')
      .select('*, departamento:departamentos(id, nome, sigla)')
      .eq('id', data.user.id)
      .single();

    if (!perfil?.ativo) throw new UnauthorizedException('Usuário inativo');

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: { ...perfil, email: data.user.email },
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw new UnauthorizedException('Refresh token inválido');
    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
    };
  }

  async logout(accessToken: string) {
    await this.supabase.auth.admin.signOut(accessToken);
    return { success: true };
  }
}
