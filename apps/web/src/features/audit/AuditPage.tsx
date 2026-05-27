import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabaseClient';
import { PageHeader } from '@/shared/components/PageHeader';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
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

const thSt = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 10.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#5b667a',
  fontWeight: 500,
  borderBottom: '1px solid #e3e7ee',
  whiteSpace: 'nowrap' as const,
};

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [tabela, setTabela] = useState('');
  const [operacao, setOperacao] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);

  const LIMIT = 50;

  const { data, isLoading } = useQuery<{ data: AuditLog[]; meta: ApiMeta }>({
    queryKey: ['audit', { page, tabela, operacao, de, ate }],
    queryFn: async () => {
      const from = (page - 1) * LIMIT;
      const to = from + LIMIT - 1;

      let query = supabase
        .from('audit_log')
        .select('*, usuario:perfis(id, nome)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (tabela) query = query.eq('tabela', tabela);
      if (operacao) query = query.eq('operacao', operacao);
      if (de) query = query.gte('created_at', de);
      if (ate) query = query.lte('created_at', ate + 'T23:59:59');

      const { data: rows, error, count } = await query;
      if (error) throw new Error(error.message);

      const total = count ?? 0;
      const meta: ApiMeta = { page, limit: LIMIT, total, totalPages: Math.max(1, Math.ceil(total / LIMIT)) };
      return { data: (rows ?? []) as AuditLog[], meta };
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
      <PageHeader
        title="Log de Auditoria"
        description="Histórico completo de operações no sistema."
      />

      {/* Filters */}
      <div className="rounded-xl border border-line bg-white p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Tabela
            </label>
            <select
              value={tabela}
              onChange={(e) => { setTabela(e.target.value); setPage(1); }}
              className={inputClass}
            >
              <option value="">Todas</option>
              <option value="empenhos">empenhos</option>
              <option value="descontos">descontos</option>
              <option value="liquidacoes">liquidacoes</option>
              <option value="parcelas">parcelas</option>
              <option value="perfis">perfis</option>
              <option value="departamentos">departamentos</option>
            </select>
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

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead style={{ background: '#f6f8fb' }}>
            <tr>
              <th className="px-4 py-3 text-left" style={thSt}>Data/Hora</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thSt}>Tabela</th>
              <th className="px-4 py-3 text-left" style={thSt}>Operação</th>
              <th className="px-4 py-3 text-left col-hide-sm" style={thSt}>Registro</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thSt}>Usuário</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thSt}>IP</th>
              <th className="px-4 py-3 text-right" style={thSt}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={8} cols={[
                { width: 'w-28' },
                { width: 'w-24', hidden: 'mobile' },
                { width: 'w-16' },
                { width: 'w-20', hidden: 'sm' },
                { width: 'w-32', hidden: 'mobile' },
                { width: 'w-16', hidden: 'mobile' },
                { width: 'w-8' },
              ]} />
            ) : (
              <>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c8cdd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        {hasFilters ? (
                          <>
                            <p className="text-sm font-medium text-ink-700">Nenhum resultado para estes filtros</p>
                            <button
                              onClick={resetFiltros}
                              className="text-xs text-accent-blue font-medium hover:underline mt-0.5"
                            >
                              Limpar filtros
                            </button>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-ink-700">Nenhum registro de auditoria ainda</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr className="hover:bg-bg-soft transition" style={{ borderBottom: '1px solid #eef1f6' }}>
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
                          background: (OPERACAO_PILL[log.operacao] ?? { bg: '#f0f3f8' }).bg,
                          color: (OPERACAO_PILL[log.operacao] ?? { color: '#5b667a' }).color,
                        }}>
                          {log.operacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 col-hide-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: '#5b667a' }}>
                        {log.registro_id}
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs col-hide-mobile">
                        {log.usuario?.nome ?? log.usuario_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-500 text-xs col-hide-mobile">{log.ip ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {(log.dados_antes || log.dados_depois) && (
                          <button
                            onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                            aria-label={expandido === log.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition"
                            style={{
                              background: expandido === log.id ? '#e3e7ee' : '#eaf4ff',
                              color:      expandido === log.id ? '#2a3344'  : '#1a5fa8',
                            }}
                          >
                            {expandido === log.id ? 'Ocultar' : 'Ver'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandido === log.id && (
                      <tr>
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
                  </Fragment>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {!isLoading && meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-ink-500">
          <span>{meta.total} registros · Página {meta.page} de {meta.totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-line bg-white hover:border-ink-700 disabled:opacity-40 transition text-ink-700 text-sm font-medium"
            >
              Anterior
            </button>
            <input
              type="number"
              min={1}
              max={meta.totalPages}
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= meta.totalPages) setPage(v);
              }}
              className="w-14 rounded-lg border border-line px-2 py-1.5 text-center text-sm text-ink-700 bg-white outline-none focus:border-ink-900 transition"
              aria-label="Ir para página"
            />
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
    </div>
  );
}
