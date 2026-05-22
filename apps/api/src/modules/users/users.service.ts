import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase.module';
import type { Perfil } from '@ficha-empenho/shared';

@Injectable()
export class UsersService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async listar() {
    const { data, error } = await this.supabase
      .from('perfis')
      .select('*, departamento:departamentos(id, nome, sigla)')
      .order('nome');
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async buscarPorId(id: string) {
    const { data, error } = await this.supabase
      .from('perfis')
      .select('*, departamento:departamentos(id, nome, sigla)')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Usuário não encontrado');
    return data;
  }

  async criar(dto: {
    nome: string;
    email: string;
    password: string;
    role: string;
    departamento_id?: number;
  }) {
    // Cria no Supabase Auth
    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: { nome: dto.nome, role: dto.role },
      });

    if (authError) throw new BadRequestException(authError.message);

    // Upsert perfil (o trigger já criou, mas garante role e departamento)
    const { data, error } = await this.supabase
      .from('perfis')
      .upsert({
        id: authData.user.id,
        nome: dto.nome,
        role: dto.role,
        departamento_id: dto.departamento_id ?? null,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { ...data, email: dto.email };
  }

  async atualizar(
    id: string,
    dto: { nome?: string; role?: string; departamento_id?: number; ativo?: boolean },
    currentUser: Perfil,
  ) {
    // Impede que o último superadmin seja rebaixado
    if (dto.role && dto.role !== 'superadmin') {
      const { count } = await this.supabase
        .from('perfis')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'superadmin')
        .eq('ativo', true);
      if ((count ?? 0) <= 1 && currentUser.id === id) {
        throw new ForbiddenException('Não é possível remover o único superadmin ativo');
      }
    }

    const { data, error } = await this.supabase
      .from('perfis')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Usuário não encontrado');
    return data;
  }

  async desativar(id: string, currentUser: Perfil) {
    if (id === currentUser.id) {
      throw new ForbiddenException('Não é possível desativar o próprio usuário');
    }
    return this.atualizar(id, { ativo: false }, currentUser);
  }
}
