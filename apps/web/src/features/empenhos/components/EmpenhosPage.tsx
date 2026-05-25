import { useState } from 'react';
import { useEmpenhos, useEmpenho, useExcluirEmpenho } from '../hooks/useEmpenhos';
import { formatCurrencyBR } from '@ficha-empenho/shared';
import type { Empenho } from '@ficha-empenho/shared';
import { EmpenhoForm } from './EmpenhoForm';
import { FichaEmpenho } from './FichaEmpenho';

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
    return (
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      </div>
    );
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
  2: 'Reexercício',
  3: 'Global',
};

export function EmpenhosPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'form' | 'ficha'>('list');
  const [editId, setEditId] = useState<number | null>(null);

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
      {/* Header */}
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#0f1622' }}>
          Empenhos
        </h2>
        <p style={{ fontSize: 14, color: '#5b667a', margin: 0 }}>
          Fichas de empenho registradas no exercício atual.
        </p>
      </div>

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
                  <th className="px-4 py-3 text-left" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Código
                  </th>
                  <th className="px-4 py-3 text-left col-hide-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Ficha
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Credor
                  </th>
                  <th className="px-4 py-3 text-left col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Data
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-400 text-sm">
                      Nenhum empenho encontrado
                    </td>
                  </tr>
                )}
                {data?.data?.map((e: Empenho) => (
                  <tr key={e.id} className="hover:bg-bg-soft transition" style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td className="px-4 py-3" style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color: '#2a3344', fontSize: 13 }}>
                      {e.codigo_interno}
                    </td>
                    <td className="px-4 py-3 text-ink-500 col-hide-sm">{e.numero_ficha ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-700 max-w-[160px] md:max-w-[200px] truncate">{e.credor_nome ?? '—'}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditId(e.id); setView('ficha'); }}
                          className="px-2 py-1 rounded-lg text-ink-500 hover:bg-bg-soft-2 hover:text-ink-900 text-xs font-medium transition"
                        >
                          Ficha
                        </button>
                        <button
                          onClick={() => { setEditId(e.id); setView('form'); }}
                          className="px-2 py-1 rounded-lg text-accent-blue hover:bg-[#eaf4ff] text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir este empenho?')) excluir.mutate(e.id);
                          }}
                          className="px-2 py-1 rounded-lg text-accent-red hover:bg-[#fef5f5] text-xs font-medium transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-ink-500">
              <span>
                {data.meta.total} registros · Página {data.meta.page} de {data.meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-line bg-white hover:border-ink-700 disabled:opacity-40 transition text-ink-700 text-sm font-medium"
                >
                  Anterior
                </button>
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
        </>
      )}
    </div>
  );
}
