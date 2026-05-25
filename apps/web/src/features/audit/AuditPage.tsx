import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import type { AuditLog, ApiMeta } from '@ficha-empenho/shared';

const OPERACAO_PILL: Record<string, { bg: string; color: string }> = {
  INSERT: { bg: '#effaf2', color: '#1f7a3f' },
  UPDATE: { bg: '#fff5dd', color: '#8a5a08' },
  DELETE: { bg: '#fef5f5', color: '#8b2424' },
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
          page, limit: 50,
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
  const hasFilters = !!(tabela || operacao || de || ate);

  function resetFiltros() {
    setTabela(''); setOperacao(''); setDe(''); setAte(''); setPage(1);
  }

  const inputClass = "rounded-xl border border-line px-3 py-2 text-sm bg-white text-ink-900 outline-none focus:border-ink-900 transition w-full";

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#0f1622' }}>
          Log de Auditoria
        </h2>
        <p style={{ fontSize: 14, color: '#5b667a', margin: 0 }}>
          Histórico completo de operações no sistema.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-line bg-white p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Tabela
            </label>
            <input
              value={tabela}
              onChange={(e) => { setTabela(e.target.value); setPage(1); }}
              placeholder="ex: empenhos"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Operação
            </label>
            <select
              value={operacao}
              onChange={(e) => { setOperacao(e.target.value); setPage(1); }}
              className={inputClass}
            >
              <option value="">Todas</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              De
            </label>
            <input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPage(1); }} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Até
            </label>
            <input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPage(1); }} className={inputClass} />
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3 pt-3 border-t border-line-2">
            <button onClick={resetFiltros} className="text-sm text-accent-blue hover:underline font-medium">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead style={{ background: '#f6f8fb' }}>
                <tr>
                  {[
                    { label: 'Data/Hora', className: '' },
                    { label: 'Tabela', className: 'col-hide-mobile' },
                    { label: 'Operação', className: '' },
                    { label: 'Registro', className: 'col-hide-sm' },
                    { label: 'Usuário', className: 'col-hide-mobile' },
                    { label: 'IP', className: 'col-hide-mobile' },
                    { label: 'Detalhes', className: '' },
                  ].map(({ label, className }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-left ${className}`}
                      style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', whiteSpace: 'nowrap' }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-400 text-sm">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-bg-soft transition" style={{ borderBottom: '1px solid #eef1f6' }}>
                      <td className="px-4 py-3 text-ink-500 whitespace-nowrap text-xs">
                        {dataBR(log.created_at)}
                      </td>
                      <td className="px-4 py-3 col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: '#2a3344' }}>
                        {log.tabela}
                      </td>
                      <td className="px-4 py-3">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 999,
                          fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 500,
                          ...(OPERACAO_PILL[log.operacao] ?? { bg: '#f0f3f8', color: '#5b667a' }),
                          background: (OPERACAO_PILL[log.operacao] ?? { bg: '#f0f3f8' }).bg,
                          color: (OPERACAO_PILL[log.operacao] ?? { color: '#5b667a' }).color,
                        }}>
                          {log.operacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 col-hide-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: '#5b667a' }}>
                        {log.registro_id}
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs col-hide-mobile">{log.usuario_id ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-500 text-xs col-hide-mobile">{log.ip ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {(log.dados_antes || log.dados_depois) && (
                          <button
                            onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                            className="text-xs font-medium text-accent-blue hover:underline"
                          >
                            {expandido === log.id ? 'Ocultar' : 'Ver'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandido === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={7} className="px-4 py-3" style={{ background: '#f6f8fb', borderBottom: '1px solid #eef1f6' }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.dados_antes && (
                              <div>
                                <p className="text-xs font-semibold text-ink-500 mb-1.5">Antes:</p>
                                <pre className="bg-white rounded-lg border border-line p-3 overflow-x-auto text-xs text-ink-700" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                                  {JSON.stringify(log.dados_antes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.dados_depois && (
                              <div>
                                <p className="text-xs font-semibold text-ink-500 mb-1.5">Depois:</p>
                                <pre className="bg-white rounded-lg border border-line p-3 overflow-x-auto text-xs text-ink-700" style={{ fontFamily: '"IBM Plex Mono", monospace' }}>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-ink-500">
              <span>{meta.total} registros · Página {meta.page} de {meta.totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-line bg-white hover:border-ink-700 disabled:opacity-40 transition text-ink-700 text-sm font-medium"
                >
                  Anterior
                </button>
                <button
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-line bg-white hover:border-ink-700 disabled:opacity-40 transition text-ink-700 text-sm font-medium"
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
