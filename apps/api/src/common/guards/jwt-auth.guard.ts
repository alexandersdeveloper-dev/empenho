import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Token não fornecido');

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Token inválido');

    // Busca o perfil com role e departamento
    const { data: perfil, error: perfilError } = await this.supabase
      .from('perfis')
      .select('*, departamento:departamentos(id, nome, sigla)')
      .eq('id', data.user.id)
      .single();

    if (perfilError || !perfil) throw new UnauthorizedException('Perfil não encontrado');
    if (!perfil.ativo) throw new UnauthorizedException('Usuário inativo');

    request.user = { ...perfil, email: data.user.email };
    request.accessToken = token;
    return true;
  }

  private extractToken(request: Request): string | null {
    const auth = (request.headers as Record<string, string>)['authorization'];
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
