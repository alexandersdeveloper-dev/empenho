import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import type { AuditLog, ApiMeta } from '@ficha-empenho/shared';

const OPERACAO_BADGE: Record<string, string> = {
  INSERT: 'bg-green-50 text-green-700',
  UPDATE: 'bg-yellow-50 text-yellow-700',
  DELETE: 'bg-red-50 text-red-700',
};

function dataBR(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime())
    ? s
    : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [tabela, setTabela] = useState('');
  const [operacao, setOperacao] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ data: AuditLog[]; meta: ApiMeta }>({
    queryKey: ['audit', { page, tabela, operacao, de, ate }],
    queryFn: async () => {
      const { data } = await apiClient.get('/audit', {
        params: {
          page,
          limit: 50,
          tabela: tabela || undefined,
          operacao: operacao || undefined,
          de: de || undefined,
          ate: ate || undefined,
        },
      });
      return data;
    },
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  function resetFiltros() {
    setTabela('');
    setOperacao('');
    setDe('');
    setAte('');
    setPage(1);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Log de Auditoria</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tabela</label>
          <input
            value={tabela}
            onChange={(e) => { setTabela(e.target.value); setPage(1); }}
            placeholder="ex: empenhos"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Operação</label>
          <select
            value={operacao}
            onChange={(e) => { setOperacao(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
          >
            <option value="">Todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input
            type="date"
            value={de}
            onChange={(e) => { setDe(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Até</label>
          <input
            type="date"
            value={ate}
            onChange={(e) => { setAte(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {(tabela || operacao || de || ate) && (
          <button
            onClick={resetFiltros}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Data/Hora</th>
                  <th className="px-4 py-3 text-left">Tabela</th>
                  <th className="px-4 py-3 text-left">Operação</th>
                  <th className="px-4 py-3 text-left">Registro</th>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {dataBR(log.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{log.tabela}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            OPERACAO_BADGE[log.operacao] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {log.operacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{log.registro_id}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{log.usuario_id ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{log.ip ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {(log.dados_antes || log.dados_depois) && (
                          <button
                            onClick={() =>
                              setExpandido(expandido === log.id ? null : log.id)
                            }
                            className="text-brand-600 hover:underline text-xs"
                          >
                            {expandido === log.id ? 'Ocultar' : 'Ver'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandido === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td
                          colSpan={7}
                          className="px-4 py-3 bg-gray-50 border-t border-gray-100"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {log.dados_antes && (
                              <div>
                                <p className="text-gray-500 font-sans mb-1 font-semibold">Antes:</p>
                                <pre className="bg-white rounded border border-gray-200 p-2 overflow-x-auto text-xs">
                                  {JSON.stringify(log.dados_antes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.dados_depois && (
                              <div>
                                <p className="text-gray-500 font-sans mb-1 font-semibold">Depois:</p>
                                <pre className="bg-white rounded border border-gray-200 p-2 overflow-x-auto text-xs">
                                  {JSON.stringify(log.dados_depois, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                {meta.total} registros · Página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
