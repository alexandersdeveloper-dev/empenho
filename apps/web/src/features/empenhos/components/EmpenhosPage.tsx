import { useState } from 'react';
import { useEmpenhos, useEmpenho, useExcluirEmpenho } from '../hooks/useEmpenhos';
import { formatCurrencyBR } from '@ficha-empenho/shared';
import type { Empenho } from '@ficha-empenho/shared';
import { EmpenhoForm } from './EmpenhoForm';
import { EmpenhoFormSkeleton } from './EmpenhoFormSkeleton';
import { FichaEmpenho } from './FichaEmpenho';
import { ConfirmDeleteModal } from '@/shared/components/ConfirmDeleteModal';
import { PageHeader } from '@/shared/components/PageHeader';
import { TableSkeleton } from '@/shared/components/TableSkeleton';

function FichaView({
  fichaId,
  onVoltar,
  onEditar,
}: {
  fichaId: number;
  onVoltar: () => void;
  onEditar: () => void;
}) {
  const { data: empenho, isLoading } = useEmpenho(fichaId);

  if (isLoading || !empenho) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      </div>
    );
  }

  return <FichaEmpenho empenho={empenho} onVoltar={onVoltar} onEditar={onEditar} />;
}

function FormView({
  editId,
  onSuccess,
  onCancel,
}: {
  editId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { data: empenho, isLoading } = useEmpenho(editId ?? 0);

  if (editId && isLoading) {
    return <EmpenhoFormSkeleton />;
  }

  return (
    <EmpenhoForm
      empenho={editId ? empenho : undefined}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}

const TIPO_LABEL: Record<number, string> = {
  1: 'Ordinário',
  2: 'Estimativo',
  3: 'Global',
  4: 'Sub-Empenho',
  5: 'Despesa Extra',
  6: 'Receita Extra',
};

const thSt = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 10.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#5b667a',
  fontWeight: 500,
  borderBottom: '1px solid #e3e7ee',
};

export function EmpenhosPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'form' | 'ficha'>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; codigo: string } | null>(null);

  const { data, isLoading } = useEmpenhos({ q: q || undefined, page, limit: 50 });
  const excluir = useExcluirEmpenho();

  if (view === 'ficha' && editId) {
    return (
      <FichaView
        fichaId={editId}
        onVoltar={() => { setView('list'); setEditId(null); }}
        onEditar={() => setView('form')}
      />
    );
  }

  if (view === 'form') {
    return (
      <FormView
        editId={editId}
        onSuccess={() => { setView('list'); setEditId(null); }}
        onCancel={() => { setView('list'); setEditId(null); }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Empenhos"
        description="Fichas de empenho registradas no exercício atual."
      />

      {/* Search + action row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar por nº ficha ou credor..."
          className="w-full sm:max-w-xs rounded-xl border border-line px-4 py-2.5 text-sm bg-white text-ink-900 outline-none focus:border-ink-900 transition placeholder:text-ink-400"
        />
        <button
          onClick={() => setView('form')}
          className="inline-flex items-center gap-2 rounded-xl bg-ink-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-ink-700 transition sm:ml-auto whitespace-nowrap"
        >
          + Novo Empenho
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead style={{ background: '#f6f8fb' }}>
            <tr>
              <th className="px-4 py-3 text-left" style={thSt}>Código</th>
              <th className="px-4 py-3 text-left col-hide-sm" style={thSt}>Ficha</th>
              <th className="px-4 py-3 text-left" style={thSt}>Credor</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thSt}>Tipo</th>
              <th className="px-4 py-3 text-right" style={thSt}>Valor</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thSt}>Data</th>
              <th className="px-3 py-2.5 text-right" style={thSt}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={8} cols={[
                { width: 'w-16' },
                { width: 'w-12', hidden: 'sm' },
                { width: 'w-3/4' },
                { width: 'w-20', hidden: 'mobile' },
                { width: 'w-20' },
                { width: 'w-16', hidden: 'mobile' },
                { width: 'w-16' },
              ]} />
            ) : (
              <>
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {q ? (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c8cdd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        ) : (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c8cdd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        )}
                        {q ? (
                          <>
                            <p className="text-sm font-medium text-ink-700">Nenhum resultado para esta busca</p>
                            <button
                              onClick={() => { setQ(''); setPage(1); }}
                              className="text-xs text-accent-blue font-medium hover:underline mt-0.5"
                            >
                              Limpar busca
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-ink-700">Nenhum empenho registrado ainda</p>
                            <button
                              onClick={() => setView('form')}
                              className="text-xs text-accent-blue font-medium hover:underline mt-0.5"
                            >
                              + Criar primeiro empenho
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {data?.data?.map((e: Empenho) => (
                  <tr
                    key={e.id}
                    onClick={() => { setEditId(e.id); setView('ficha'); }}
                    className="hover:bg-bg-soft transition cursor-pointer"
                    style={{ borderBottom: '1px solid #eef1f6' }}
                  >
                    <td className="px-4 py-3" style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color: '#2a3344', fontSize: 13 }}>
                      {e.codigo_interno}
                    </td>
                    <td className="px-4 py-3 text-ink-500 col-hide-sm">{e.numero_ficha ?? '—'}</td>
                    <td
                      className="px-4 py-3 text-ink-700 max-w-[160px] md:max-w-[200px] truncate"
                      title={e.credor_nome ?? undefined}
                    >
                      {e.credor_nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 col-hide-mobile">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: '#eaf4ff', color: '#1a5fa8', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 500 }}>
                        {TIPO_LABEL[e.tipo_empenho]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color: '#0f1622', fontSize: 13 }}>
                      R$ {formatCurrencyBR(e.valor_empenho)}
                    </td>
                    <td className="px-4 py-3 text-ink-500 col-hide-mobile text-sm">
                      {e.data_empenho ?? '—'}
                    </td>
                    <td className="px-3 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <button
                          aria-label={`Editar empenho ${e.codigo_interno}`}
                          onClick={() => { setEditId(e.id); setView('form'); }}
                          className="px-2.5 py-1.5 rounded-lg text-accent-blue hover:bg-[#eaf4ff] text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          aria-label={`Excluir empenho ${e.codigo_interno}`}
                          onClick={() => setDeleteTarget({ id: e.id, codigo: e.codigo_interno })}
                          className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-accent-red hover:bg-[#fef5f5] text-xs font-medium transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {!isLoading && data?.meta && data.meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-ink-500">
          <span>
            {data.meta.total} registros · Página {data.meta.page} de {data.meta.totalPages}
          </span>
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
              max={data.meta.totalPages}
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= data.meta.totalPages) setPage(v);
              }}
              className="w-14 rounded-lg border border-line px-2 py-1.5 text-center text-sm text-ink-700 bg-white outline-none focus:border-ink-900 transition"
              aria-label="Ir para página"
            />
            <button
              disabled={page === data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-line bg-white hover:border-ink-700 disabled:opacity-40 transition text-ink-700 text-sm font-medium"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        codigoInterno={deleteTarget?.codigo ?? ''}
        isLoading={excluir.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          excluir.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
