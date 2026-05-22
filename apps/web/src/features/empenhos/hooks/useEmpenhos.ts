import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/apiClient';
import type { EmpenhoFiltrosDto, CreateEmpenhoDto } from '@ficha-empenho/shared';
import type { Empenho, ApiResponse, ApiMeta } from '@ficha-empenho/shared';

const QUERY_KEY = 'empenhos';

export function useEmpenhos(filtros: Partial<EmpenhoFiltrosDto> = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, filtros],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Empenho[]> & { meta: ApiMeta }>(
        '/empenhos',
        { params: filtros },
      );
      return data;
    },
    staleTime: 30_000,
  });
}

export function useEmpenho(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Empenho>>(`/empenhos/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCriarEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateEmpenhoDto) => {
      const { data } = await apiClient.post<ApiResponse<Empenho>>('/empenhos', dto);
      return data.data;
    },
    onSuccess: (empenho) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Empenho ${empenho.codigo_interno} criado com sucesso`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Erro ao criar empenho';
      toast.error(msg);
    },
  });
}

export function useAtualizarEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: CreateEmpenhoDto }) => {
      const { data } = await apiClient.patch<ApiResponse<Empenho>>(`/empenhos/${id}`, dto);
      return data.data;
    },
    onSuccess: (empenho) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Empenho ${empenho.codigo_interno} atualizado`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Erro ao atualizar empenho';
      toast.error(msg);
    },
  });
}

export function useExcluirEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/empenhos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Empenho excluído');
    },
  });
}

// Dados de referência para autocomplete
export function useCredores(q?: string) {
  return useQuery({
    queryKey: ['credores', q],
    queryFn: async () => {
      const { data } = await apiClient.get('/credores', { params: { q } });
      return data as Array<{ id: number; numero: string | null; nome: string }>;
    },
    staleTime: 10 * 60_000,
    enabled: q !== undefined,
  });
}

export function useSubelementos(natureza?: string) {
  return useQuery({
    queryKey: ['subelementos', natureza],
    queryFn: async () => {
      const { data } = await apiClient.get('/subelementos', { params: { natureza } });
      return data as { natureza: string; items: Array<{ sub: string; descricao: string }> };
    },
    staleTime: 5 * 60_000,
    enabled: !!natureza,
  });
}

export function useClassificacaoPorFicha(ficha?: string) {
  return useQuery({
    queryKey: ['classificacao', ficha],
    queryFn: async () => {
      const { data } = await apiClient.get(`/classificacao/ficha/${ficha}`);
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
      const { data } = await apiClient.get('/config/formas-pagamento');
      return data as Array<{ codigo: string; descricao: string }>;
    },
    staleTime: 60 * 60_000,
  });
}
