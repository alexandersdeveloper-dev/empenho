import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabaseClient';
import { normalizarNatureza } from '@ficha-empenho/shared';
import type { EmpenhoFiltrosDto, CreateEmpenhoDto } from '@ficha-empenho/shared';
import type { Empenho, ApiMeta } from '@ficha-empenho/shared';

const QUERY_KEY = 'empenhos';
const PAGE_SIZE = 20;

export function useEmpenhos(filtros: Partial<EmpenhoFiltrosDto> = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, filtros],
    queryFn: async () => {
      const page = filtros.page ?? 1;
      const limit = filtros.limit ?? PAGE_SIZE;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('empenhos')
        .select(
          '*, departamento:departamentos(id, nome, sigla), credor:credores(id, nome, numero)',
          { count: 'exact' },
        )
        .order('data_empenho', { ascending: false })
        .range(from, to);

      if (filtros.q) {
        query = query.or(`numero_ficha.ilike.%${filtros.q}%,credor_nome.ilike.%${filtros.q}%`);
      }
      if (filtros.departamento_id) {
        query = query.eq('departamento_id', filtros.departamento_id);
      }
      if (filtros.tipo) {
        query = query.eq('tipo_empenho', filtros.tipo);
      }
      if (filtros.interno) {
        query = query.ilike('codigo_interno', `%${filtros.interno}%`);
      }
      if (filtros.de) {
        query = query.gte('data_empenho', filtros.de);
      }
      if (filtros.ate) {
        query = query.lte('data_empenho', filtros.ate);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      const total = count ?? 0;
      const meta: ApiMeta = {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
      return { data: (data ?? []) as Empenho[], meta };
    },
    staleTime: 30_000,
  });
}

export function useEmpenho(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empenhos')
        .select('*, descontos(*), liquidacoes:liquidacoes(*, parcelas(*)), departamento:departamentos(*), credor:credores(*)')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      // PostgREST returns related rows as arrays; normalize liquidacoes[] → liquidacao
      const raw = data as Record<string, unknown>;
      const liquidacoes = raw.liquidacoes as import('@ficha-empenho/shared').Liquidacao[] | undefined;
      return { ...raw, liquidacao: liquidacoes?.[0] } as Empenho;
    },
    enabled: !!id,
  });
}

export function useCriarEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEmpenhoDto) => {
      const { data, error } = await supabase.functions.invoke('empenho-mutate', {
        body: { action: 'criar', dto },
      });
      if (error) throw error;
      return data.data as Empenho;
    },
    onSuccess: (empenho) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Empenho ${empenho.codigo_interno} criado com sucesso`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message ?? 'Erro ao criar empenho');
    },
  });
}

export function useAtualizarEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: CreateEmpenhoDto }) => {
      const { data, error } = await supabase.functions.invoke('empenho-mutate', {
        body: { action: 'atualizar', id, dto },
      });
      if (error) throw error;
      return data.data as Empenho;
    },
    onSuccess: (empenho) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Empenho ${empenho.codigo_interno} atualizado`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message ?? 'Erro ao atualizar empenho');
    },
  });
}

export function useExcluirEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.functions.invoke('empenho-mutate', {
        body: { action: 'excluir', id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Empenho excluído');
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message ?? 'Erro ao excluir empenho');
    },
  });
}

export function useCredores(q?: string) {
  return useQuery({
    queryKey: ['credores', q],
    queryFn: async () => {
      let query = supabase.from('credores').select('id, numero, nome').limit(20);
      if (q) query = query.or(`nome.ilike.%${q}%,numero.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ id: number; numero: string | null; nome: string }>;
    },
    staleTime: 10 * 60_000,
    enabled: q !== undefined,
  });
}

export function useSubelementos(natureza?: string) {
  return useQuery({
    queryKey: ['subelementos', natureza],
    queryFn: async () => {
      const nat = normalizarNatureza(natureza ?? '');
      const { data, error } = await supabase
        .from('subelementos')
        .select('sub, descricao')
        .eq('natureza', nat)
        .order('sub');
      if (error) throw new Error(error.message);
      return {
        natureza: nat,
        items: (data ?? []) as Array<{ sub: string; descricao: string }>,
      };
    },
    staleTime: 5 * 60_000,
    enabled: !!natureza,
  });
}

export function useClassificacaoPorFicha(ficha?: string) {
  return useQuery({
    queryKey: ['classificacao', ficha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classificacao_orcamentaria')
        .select('projeto_atividade, dotacao, stn')
        .eq('numero_ficha', ficha)
        .single();
      if (error) throw new Error(error.message);
      return data as { projeto_atividade: string; dotacao: string; stn: string };
    },
    staleTime: 5 * 60_000,
    enabled: !!ficha,
  });
}

export function useFormasPagamento() {
  return useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('codigo, descricao')
        .order('descricao');
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ codigo: string; descricao: string }>;
    },
    staleTime: 60 * 60_000,
  });
}
