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
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
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
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Empenhos</h2>
        <button
          onClick={() => setView('form')}
          className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition"
        >
          + Novo Empenho
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Buscar por nº ficha ou credor..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
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
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Ficha</th>
                  <th className="px-4 py-3 text-left">Credor</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Nenhum empenho encontrado
                    </td>
                  </tr>
                )}
                {data?.data?.map((e: Empenho) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-brand-700">
                      {e.codigo_interno}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.numero_ficha ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{e.credor_nome ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                        {TIPO_LABEL[e.tipo_empenho]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      R$ {formatCurrencyBR(e.valor_empenho)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.data_empenho ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditId(e.id); setView('ficha'); }}
                          className="text-gray-600 hover:underline text-xs"
                        >
                          Ficha
                        </button>
                        <button
                          onClick={() => { setEditId(e.id); setView('form'); }}
                          className="text-brand-600 hover:underline text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir este empenho?')) excluir.mutate(e.id);
                          }}
                          className="text-red-500 hover:underline text-xs"
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
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                {data.meta.total} registros · Página {data.meta.page} de {data.meta.totalPages}
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
                  disabled={page === data.meta.totalPages}
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
