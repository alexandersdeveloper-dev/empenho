import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabaseClient';
import { edgeFnError } from '@/shared/lib/edgeFnError';
import { PageHeader } from '@/shared/components/PageHeader';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const IMPORTS: Array<{ key: string; label: string; tipo: string; description: string }> = [
  {
    key: 'classificacao',
    label: 'Classificação Orçamentária',
    tipo: 'classificacao',
    description: 'Colunas: numero_ficha, projeto_atividade, dotacao, stn',
  },
  {
    key: 'credores',
    label: 'Credores',
    tipo: 'credores',
    description: 'Colunas: numero, nome',
  },
  {
    key: 'subelementos',
    label: 'Sub-elementos',
    tipo: 'subelementos',
    description: 'Colunas: natureza, sub, descricao',
  },
  {
    key: 'retencoes',
    label: 'Retenções',
    tipo: 'retencoes',
    description: 'Colunas: codigo, nome. Substitui todos os registros.',
  },
  {
    key: 'formas_pagamento',
    label: 'Formas de Pagamento',
    tipo: 'formas_pagamento',
    description: 'Colunas: codigo, descricao. Substitui todos os registros.',
  },
  {
    key: 'efd',
    label: 'Códigos EFD',
    tipo: 'efd',
    description: 'Colunas: codigo, descricao',
  },
];

function UploadCard({
  label,
  tipo,
  description,
}: {
  label: string;
  tipo: string;
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
    form.append('tipo', tipo);

    try {
      const { data, error } = await supabase.functions.invoke('import', { body: form });
      if (error) throw error;
      setState('done');
      setResult(data);
      toast.success(`${label}: importação concluída`);
    } catch (err: unknown) {
      setState('error');
      const msg = edgeFnError(err);
      setResult({ message: msg });
      toast.error(msg);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{label}</h3>
        <p className="text-xs text-ink-400 mt-0.5">{description}</p>
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
        <div
          className="rounded-xl px-3 py-2 text-xs"
          style={{ background: '#effaf2', border: '1px solid #b7e4c7', color: '#1f7a3f' }}
        >
          {result.inserted != null && <span>Inseridos: {result.inserted} · </span>}
          {result.updated != null && <span>Atualizados: {result.updated} · </span>}
          {result.deleted != null && <span>Removidos: {result.deleted} · </span>}
          {result.errors != null && <span>Erros: {result.errors}</span>}
          {result.message && <span>{result.message}</span>}
        </div>
      )}

      {state === 'error' && result?.message && (
        <div
          className="rounded-xl px-3 py-2 text-xs"
          style={{ background: '#fef5f5', border: '1px solid #f9c1c1', color: '#8b2424' }}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}

export function ImportPage() {
  return (
    <div>
      <PageHeader
        title="Importar Dados"
        description="Faça upload de planilhas Excel (.xlsx/.xls) ou CSV para popular as tabelas do sistema."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORTS.map(({ key, label, tipo, description }) => (
          <UploadCard key={key} label={label} tipo={tipo} description={description} />
        ))}
      </div>
    </div>
  );
}
