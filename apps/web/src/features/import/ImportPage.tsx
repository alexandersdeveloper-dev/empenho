import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/apiClient';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const IMPORTS: Array<{ key: string; label: string; endpoint: string; description: string }> = [
  {
    key: 'classificacao',
    label: 'Classificação Orçamentária',
    endpoint: '/import/classificacao',
    description: 'Colunas: numero_ficha, projeto_atividade, dotacao, stn',
  },
  {
    key: 'credores',
    label: 'Credores',
    endpoint: '/import/credores',
    description: 'Colunas: numero, nome',
  },
  {
    key: 'subelementos',
    label: 'Sub-elementos',
    endpoint: '/import/subelementos',
    description: 'Colunas: natureza, sub, descricao',
  },
  {
    key: 'retencoes',
    label: 'Retenções',
    endpoint: '/import/retencoes',
    description: 'Colunas: codigo, nome. Substitui todos os registros.',
  },
  {
    key: 'formas_pagamento',
    label: 'Formas de Pagamento',
    endpoint: '/import/formas-pagamento',
    description: 'Colunas: codigo, descricao. Substitui todos os registros.',
  },
  {
    key: 'efd',
    label: 'Códigos EFD',
    endpoint: '/import/efd',
    description: 'Colunas: codigo, descricao',
  },
];

function UploadCard({
  label,
  endpoint,
  description,
}: {
  label: string;
  endpoint: string;
  description: string;
}) {
  const [state, setState] = useState<UploadState>('idle');
  const [result, setResult] = useState<{
    inserted?: number;
    updated?: number;
    deleted?: number;
    errors?: number;
    message?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato inválido. Use .xlsx, .xls ou .csv');
      return;
    }

    setState('uploading');
    setResult(null);
    const form = new FormData();
    form.append('file', file);

    try {
      const { data } = await apiClient.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setState('done');
      setResult(data);
      toast.success(`${label}: importação concluída`);
    } catch (err: unknown) {
      setState('error');
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Erro na importação';
      setResult({ message: msg });
      toast.error(msg);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={state === 'uploading'}
          className="rounded-xl border border-ink-900 text-ink-900 px-4 py-1.5 text-sm font-semibold hover:bg-bg-soft transition disabled:opacity-60"
        >
          {state === 'uploading' ? 'Enviando…' : 'Selecionar arquivo'}
        </button>

        {state === 'uploading' && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-900 border-t-transparent" />
        )}
      </div>

      {state === 'done' && result && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
          {result.inserted != null && <span>Inseridos: {result.inserted} · </span>}
          {result.updated != null && <span>Atualizados: {result.updated} · </span>}
          {result.deleted != null && <span>Removidos: {result.deleted} · </span>}
          {result.errors != null && <span>Erros: {result.errors}</span>}
          {result.message && <span>{result.message}</span>}
        </div>
      )}

      {state === 'error' && result?.message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          {result.message}
        </div>
      )}
    </div>
  );
}

export function ImportPage() {
  return (
    <div>
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#0f1622' }}>
          Importar Dados
        </h2>
        <p style={{ fontSize: 14, color: '#5b667a', margin: 0 }}>
          Faça upload de planilhas Excel (.xlsx/.xls) ou CSV para popular as tabelas do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORTS.map(({ key, ...imp }) => (
          <UploadCard key={key} {...imp} />
        ))}
      </div>
    </div>
  );
}
