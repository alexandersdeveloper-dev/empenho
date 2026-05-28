import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { EmpenhoSchema, type EmpenhoDto, normalizarNatureza, padSubelemento, formatCurrencyBR, parseCurrencyBR } from '@ficha-empenho/shared';
import { supabase } from '@/shared/lib/supabaseClient';
import { useCriarEmpenho, useAtualizarEmpenho, useFormasPagamento } from '../hooks/useEmpenhos';
import { Combobox } from '@/shared/components/Combobox';
import { cn } from '@/shared/lib/cn';
import type { Empenho } from '@ficha-empenho/shared';

type Props = {
  empenho?: Empenho;
  onSuccess?: (empenho: Empenho) => void;
  onCancel?: () => void;
};

const TIPO_OPTS = [
  { value: 1, label: 'Ordinário' },
  { value: 2, label: 'Estimativo' },
  { value: 3, label: 'Global' },
  { value: 4, label: 'Sub-Empenho' },
  { value: 5, label: 'Despesa Extra' },
  { value: 6, label: 'Receita Extra' },
];

const EXERCICIO_OPTS = [
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Superávit' },
];

export function EmpenhoForm({ empenho, onSuccess, onCancel }: Props) {
  const isEdit = !!empenho;
  const criar = useCriarEmpenho();
  const atualizar = useAtualizarEmpenho();
  const { data: formasPagamento = [] } = useFormasPagamento();

  const [subsAtuais, setSubsAtuais] = useState<Array<{ sub: string; descricao: string }>>([]);
  const [naturezaAtual, setNaturezaAtual] = useState('');
  const [showSubSugestoes, setShowSubSugestoes] = useState(false);
  const [subFiltro, setSubFiltro] = useState('');
  const [classificacaoTravada, setClassificacaoTravada] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EmpenhoDto>({
    resolver: zodResolver(EmpenhoSchema),
    defaultValues: empenho
      ? {
          numero_ficha: empenho.numero_ficha ?? '',
          projeto_atividade: empenho.projeto_atividade ?? '',
          dotacao: empenho.dotacao ?? '',
          stn: empenho.stn ?? '',
          subelemento_codigo: empenho.subelemento_codigo ?? '',
          subelemento_descricao: empenho.subelemento_descricao ?? '',
          credor_id: empenho.credor_id ?? undefined,
          credor_numero: empenho.credor_numero ?? '',
          credor_nome: empenho.credor_nome ?? '',
          tipo_empenho: (empenho.tipo_empenho as 1 | 2 | 3 | 4 | 5 | 6) ?? 1,
          historico: empenho.historico ?? '',
          valor_empenho: empenho.valor_empenho ?? 0,
          emenda: empenho.emenda ?? undefined,
          exercicio: (empenho.exercicio as 1 | 2) ?? 1,
          numero_contrato: empenho.numero_contrato ?? '',
          numero_convenio: empenho.numero_convenio ?? '',
          data_empenho: empenho.data_empenho ?? null,
          fonte_recurso: empenho.fonte_recurso ?? '',
          ficha_extra_codigo: empenho.ficha_extra_codigo ?? '',
          ficha_extra_descricao: empenho.ficha_extra_descricao ?? '',
          descontos: empenho.descontos ?? [],
          liquidacao: empenho.liquidacao
            ? {
                valor: empenho.liquidacao.valor,
                data_liquidacao: empenho.liquidacao.data_liquidacao ?? null,
                data_pagamento: empenho.liquidacao.data_pagamento ?? null,
                numero_op: empenho.liquidacao.numero_op ?? '',
                forma_pagamento: empenho.liquidacao.forma_pagamento ?? '',
                conta: empenho.liquidacao.conta ?? '',
                parcelas: empenho.liquidacao.parcelas ?? [],
              }
            : undefined,
        }
      : {
          tipo_empenho: 1,
          exercicio: 1,
          valor_empenho: 0,
          descontos: [],
        },
  });

  const tipoEmpenho = useWatch({ control, name: 'tipo_empenho' });
  const exercicio = useWatch({ control, name: 'exercicio' });
  const valorEmpenho = useWatch({ control, name: 'valor_empenho' });
  const descontosWatch = useWatch({ control, name: 'descontos' });

  const isSuperavit = exercicio === 2;
  const isGlobal = tipoEmpenho === 3;
  const isSubEmpenho = tipoEmpenho === 4;
  const isDespesaExtra = tipoEmpenho === 5;
  const isReceitaExtra = tipoEmpenho === 6;
  const showClassificacao = !isSubEmpenho && !isDespesaExtra && !isReceitaExtra;
  const showFichaExtra = isDespesaExtra || isReceitaExtra;
  const showDescontos = !isReceitaExtra;

  const totalDescontos = (descontosWatch ?? []).reduce(
    (sum, d) => sum + (Number(d?.valor) || 0),
    0,
  );
  const valorLiquido = Math.max(0, (Number(valorEmpenho) || 0) - totalDescontos);

  useEffect(() => {
    setValue('liquidacao.valor', valorLiquido);
  }, [valorLiquido, setValue]);

  const { fields: descontoFields, append: addDesconto, remove: removeDesconto } = useFieldArray({
    control,
    name: 'descontos',
  });

  const { fields: parcelaFields, append: addParcela, remove: removeParcela } = useFieldArray({
    control,
    name: 'liquidacao.parcelas',
  });

  const [credorBusca, setCredorBusca] = useState(empenho?.credor_nome ?? '');

  // ─── Classificação orçamentária ───────────────────────────────────────────────

  async function handleFichaBlur(ficha: string) {
    const v = ficha.trim();
    if (!v) {
      setValue('projeto_atividade', '');
      setValue('dotacao', '');
      setValue('stn', '');
      setValue('subelemento_codigo', '');
      setValue('subelemento_descricao', '');
      setClassificacaoTravada(false);
      await carregarSubs('', false);
      return;
    }

    setValue('subelemento_codigo', '');
    setValue('subelemento_descricao', '');

    try {
      const { data } = await supabase
        .from('classificacao_orcamentaria')
        .select('projeto_atividade, dotacao, stn')
        .eq('numero_ficha', v)
        .maybeSingle();
      if (data?.dotacao || data?.projeto_atividade || data?.stn) {
        setValue('projeto_atividade', data.projeto_atividade ?? '');
        setValue('dotacao', data.dotacao ?? '');
        setValue('stn', data.stn ?? '');
        if (!isSuperavit) setClassificacaoTravada(true);
        if (data.dotacao) await carregarSubs(data.dotacao, false);
      } else {
        if (!isSuperavit) setClassificacaoTravada(false);
        await carregarSubs('', false);
      }
    } catch {
      if (!isSuperavit) setClassificacaoTravada(false);
    }
  }

  useEffect(() => {
    if (isSuperavit) setClassificacaoTravada(false);
  }, [isSuperavit]);

  // ─── Sub-elemento ─────────────────────────────────────────────────────────────

  async function carregarSubs(dotacaoStr: string, manterAtual: boolean) {
    setSubsAtuais([]);
    setNaturezaAtual('');
    if (!dotacaoStr) return;

    const natureza = normalizarNatureza(dotacaoStr);
    try {
      const { data: rows } = await supabase
        .from('subelementos')
        .select('sub, descricao')
        .eq('natureza', natureza)
        .order('sub');
      const items: Array<{ sub: string; descricao: string }> = (rows ?? []).map(
        (x: { sub: string; descricao: string }) => ({
          sub: padSubelemento(x.sub),
          descricao: x.descricao ?? '',
        }),
      );
      setSubsAtuais(items);
      setNaturezaAtual(natureza);

      if (manterAtual) {
        const subAtual = padSubelemento(getValues('subelemento_codigo') ?? '');
        const found = items.find((x) => x.sub === subAtual);
        if (found) setValue('subelemento_descricao', found.descricao);
      }
    } catch {
      // modo manual silencioso
    }
  }

  useEffect(() => {
    if (isEdit && empenho?.dotacao) {
      carregarSubs(empenho.dotacao, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subsFiltradas = subFiltro
    ? subsAtuais.filter(
        (x) =>
          x.sub.includes(subFiltro) ||
          x.descricao.toLowerCase().includes(subFiltro.toLowerCase()),
      )
    : subsAtuais;

  function selecionarSub(sub: { sub: string; descricao: string }) {
    setValue('subelemento_codigo', sub.sub);
    setValue('subelemento_descricao', sub.descricao);
    if (naturezaAtual) setValue('dotacao', naturezaAtual + '.' + sub.sub);
    setShowSubSugestoes(false);
    setSubFiltro('');
  }

  function handleSubBlur() {
    setTimeout(() => {
      setShowSubSugestoes(false);
      const raw = getValues('subelemento_codigo') ?? '';
      if (!raw) return;
      const sub2 = padSubelemento(raw);
      setValue('subelemento_codigo', sub2);
      if (subsAtuais.length > 0) {
        const valid = subsAtuais.map((x) => x.sub);
        if (!valid.includes(sub2)) {
          toast.error(`Sub-elemento '${sub2}' inválido para esta natureza`);
          setValue('subelemento_codigo', '');
          setValue('subelemento_descricao', '');
          return;
        }
        const found = subsAtuais.find((x) => x.sub === sub2);
        setValue('subelemento_descricao', found?.descricao ?? '');
        if (naturezaAtual) setValue('dotacao', naturezaAtual + '.' + sub2);
      }
    }, 150);
  }

  // ─── Credor autocomplete ──────────────────────────────────────────────────────

  async function searchCredores(q: string) {
    let query = supabase.from('credores').select('id, numero, nome').limit(20);
    if (q) query = query.or(`nome.ilike.%${q}%,numero.ilike.%${q}%`);
    const { data } = await query;
    return (data ?? []).map((r) => ({
      label: (r.numero ? r.numero + ' — ' : '') + r.nome,
      value: String(r.id),
      meta: r,
    }));
  }

  function handleCredorSelect(label: string, option?: { value: string; meta?: Record<string, unknown> }) {
    setCredorBusca(label);
    if (option?.meta) {
      const m = option.meta as { id: number; numero: string | null; nome: string };
      setValue('credor_id', m.id);
      setValue('credor_numero', m.numero ?? '');
      setValue('credor_nome', m.nome);
    } else {
      setValue('credor_id', undefined);
      setValue('credor_nome', label);
    }
  }

  async function handleCredorNumeroBlur(numero: string) {
    if (!numero) return;
    try {
      const { data } = await supabase
        .from('credores')
        .select('id, nome')
        .eq('numero', numero)
        .maybeSingle();
      if (data?.nome) {
        setValue('credor_id', data.id);
        setValue('credor_nome', data.nome);
        setCredorBusca(data.nome);
      }
    } catch { /* credor não cadastrado, modo manual */ }
  }

  // ─── Retenção autocomplete ───────────────────────────────────────────────────

  async function searchRetencoes(q: string) {
    let query = supabase.from('retencoes').select('nome, codigo').limit(20);
    if (q) query = query.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%`);
    const { data } = await query;
    return (data ?? []).map((r) => ({
      label: (r.codigo ? r.codigo + ' — ' : '') + r.nome,
      value: r.codigo,
      meta: r,
    }));
  }

  async function searchEfd(q: string) {
    let query = supabase.from('efd').select('codigo, descricao').limit(20);
    if (q) query = query.ilike('codigo', `%${q}%`);
    const { data } = await query;
    return (data ?? []).map((r) => ({
      label: r.codigo + (r.descricao ? ' — ' + r.descricao : ''),
      value: r.codigo,
    }));
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: EmpenhoDto) => {
    const shouldSaveAndNew = saveAndNewRef.current;
    saveAndNewRef.current = false;
    try {
      let result: Empenho;
      if (isEdit) {
        result = await atualizar.mutateAsync({ id: empenho!.id, dto: data });
      } else {
        result = await criar.mutateAsync(data);
      }
      if (shouldSaveAndNew) {
        reset({ tipo_empenho: data.tipo_empenho, exercicio: data.exercicio, valor_empenho: 0, descontos: [] });
        setCredorBusca('');
        toast.success('Empenho criado. Formulário pronto para novo.');
      } else {
        onSuccess?.(result);
      }
    } catch {
      // erro já tratado pelo hook
    }
  };

  // ─── Salvar e Novo ────────────────────────────────────────────────────────────

  const saveAndNewRef = useRef(false);

  // ─── Enter → Tab / Ctrl+S ────────────────────────────────────────────────────

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    const el = e.target as HTMLElement;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON') return;
    e.preventDefault();
    const sel = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])';
    const all = Array.from(formRef.current?.querySelectorAll<HTMLElement>(sel) ?? []).filter(
      (x) => (x as HTMLElement).offsetParent !== null,
    );
    const idx = all.indexOf(el);
    const next = all[idx + 1] ?? all[0];
    next?.focus();
    if (next instanceof HTMLInputElement && next.type !== 'checkbox') next.select?.();
  }

  // ─── Style helpers ────────────────────────────────────────────────────────────

  const fieldCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-ink-900 focus:ring-1 focus:ring-ink-300 outline-none disabled:bg-bg-soft read-only:bg-bg-soft text-ink-900 placeholder:text-ink-400 transition';
  const labelCls = 'block text-xs font-medium text-ink-500 mb-1';
  const errorCls = 'text-xs text-accent-red mt-0.5';

  const sectionHead: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#2a3344',
    fontFamily: 'Manrope, system-ui, sans-serif',
    borderBottom: '1px solid #e3e7ee', paddingBottom: 8, marginBottom: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };

  function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        {children}
        {error && <p className={errorCls}>{error}</p>}
      </div>
    );
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 'clamp(20px, 3.5vw, 24px)', letterSpacing: '-0.02em', color: '#0f1622', margin: 0 }}>
        {isEdit ? `Editar Empenho ${empenho.codigo_interno}` : 'Novo Empenho'}
      </h2>

      {/* ── Identificação ────────────────────────────────────────────────── */}
      <section>
        <h3 style={sectionHead}>Identificação</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Exercício" error={errors.exercicio?.message}>
            <select {...register('exercicio', { valueAsNumber: true })} className={fieldCls}>
              {EXERCICIO_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de Empenho" error={errors.tipo_empenho?.message}>
            <select {...register('tipo_empenho', { valueAsNumber: true })} className={fieldCls}>
              {TIPO_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.value} — {o.label}</option>
              ))}
            </select>
          </Field>

          {!isSubEmpenho && (
            <Field label={isReceitaExtra ? 'Data de Lançamento' : 'Data do Empenho'}>
              <input type="date" {...register('data_empenho')} className={fieldCls} />
            </Field>
          )}

          <Field label="Emenda">
            <input type="number" {...register('emenda', { valueAsNumber: true })} className={fieldCls} placeholder="—" />
          </Field>

          {isSubEmpenho && (
            <div className="col-span-2 sm:col-span-4">
              <Field label="Fonte de Recurso">
                <input {...register('fonte_recurso')} className={fieldCls} placeholder="Preenchido pela ficha ou manual" />
              </Field>
            </div>
          )}
        </div>
      </section>

      {/* ── Classificação Orçamentária (oculta para tipos 4, 5, 6) ──────── */}
      {showClassificacao && (
        <section>
          <h3 style={sectionHead}>Classificação Orçamentária</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field label="Nº da Ficha">
              <input
                {...register('numero_ficha')}
                className={fieldCls}
                placeholder="Ex: 001"
                onBlur={(e) => handleFichaBlur(e.target.value)}
                onChange={() => {
                  setValue('subelemento_codigo', '');
                  setValue('subelemento_descricao', '');
                }}
              />
            </Field>

            <div className="sm:col-span-3">
              <Field label="Projeto / Atividade">
                <input
                  {...register('projeto_atividade')}
                  readOnly={classificacaoTravada}
                  className={fieldCls}
                  placeholder="Auto-preenchido pela ficha"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Dotação (Natureza)">
                <input
                  {...register('dotacao')}
                  readOnly={classificacaoTravada}
                  className={fieldCls}
                  placeholder="Ex: 3.1.90.04.00"
                  onBlur={(e) => carregarSubs(e.target.value, false)}
                />
              </Field>
            </div>

            <Field label="Fonte (STN)">
              <input
                {...register('stn')}
                readOnly={classificacaoTravada}
                className={fieldCls}
              />
            </Field>

            {/* Sub-elemento */}
            <div>
              <label className={labelCls}>Sub-elemento</label>
              <div className="relative flex gap-1">
                <div className="relative flex-1">
                  <input
                    {...register('subelemento_codigo')}
                    className={fieldCls}
                    placeholder="Código"
                    onChange={(e) => setSubFiltro(e.target.value)}
                    onFocus={() => subsAtuais.length > 0 && setShowSubSugestoes(true)}
                    onBlur={handleSubBlur}
                    autoComplete="off"
                  />
                  {showSubSugestoes && subsFiltradas.length > 0 && (
                    <ul className="absolute z-50 mt-1 w-64 rounded-lg border border-line bg-white shadow-md max-h-52 overflow-y-auto text-sm">
                      {subsFiltradas.map((s) => (
                        <li
                          key={s.sub}
                          onMouseDown={(e) => { e.preventDefault(); selecionarSub(s); }}
                          className="cursor-pointer px-3 py-2 hover:bg-bg-soft hover:text-ink-900 transition"
                        >
                          <span className="font-mono mr-2 text-ink-700">{s.sub}</span>
                          <span className="text-ink-500">{s.descricao}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!naturezaAtual) { toast.info('Informe a ficha para carregar sub-elementos'); return; }
                    setShowSubSugestoes(true);
                  }}
                  className="rounded-lg border border-line px-2.5 text-ink-500 hover:bg-bg-soft transition flex items-center justify-center"
                  title="Ver sub-elementos disponíveis"
                  aria-label="Ver sub-elementos disponíveis"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              </div>
              <input
                {...register('subelemento_descricao')}
                readOnly={subsAtuais.length > 0}
                className={cn(fieldCls, 'mt-1')}
                placeholder="Descrição do sub-elemento"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Ficha Extra (apenas para Despesa Extra e Receita Extra) ─────── */}
      {showFichaExtra && (
        <section>
          <h3 style={sectionHead}>Ficha Extra</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field label="Nº Ficha Extra">
              <input
                {...register('ficha_extra_codigo')}
                className={fieldCls}
                placeholder="Código da ficha extra"
              />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Descrição da Ficha">
                <input
                  {...register('ficha_extra_descricao')}
                  className={fieldCls}
                  placeholder="Descrição da ficha extra"
                />
              </Field>
            </div>
          </div>
        </section>
      )}

      {/* ── Credor ───────────────────────────────────────────────────────────── */}
      <section>
        <h3 style={sectionHead}>Credor</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Nº do Credor">
            <input
              {...register('credor_numero')}
              className={fieldCls}
              placeholder="Código"
              onBlur={(e) => handleCredorNumeroBlur(e.target.value)}
            />
          </Field>

          <div className="sm:col-span-3">
            <label className={labelCls}>Nome do Credor</label>
            <Combobox
              value={credorBusca}
              onChange={(val, opt) => handleCredorSelect(val, opt as { value: string; meta?: Record<string, unknown> })}
              onSearch={searchCredores}
              placeholder="Digite para buscar..."
              minChars={2}
            />
            <input type="hidden" {...register('credor_id', { valueAsNumber: true })} />
            <input type="hidden" {...register('credor_nome')} />
          </div>
        </div>
      </section>

      {/* ── Dados do Empenho ──────────────────────────────────────────────────── */}
      <section>
        <h3 style={sectionHead}>Dados do Empenho</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Histórico / Objeto">
              <textarea
                {...register('historico')}
                rows={3}
                className={cn(fieldCls, 'resize-none')}
                placeholder="Descreva o objeto ou serviço..."
              />
            </Field>
          </div>

          <Field label="Valor do Empenho (R$)" error={errors.valor_empenho?.message}>
            <Controller
              control={control}
              name="valor_empenho"
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  className={fieldCls}
                  placeholder="0,00"
                  value={formatCurrencyBR(field.value)}
                  onChange={(e) => field.onChange(parseCurrencyBR(e.target.value))}
                  onBlur={(e) => field.onChange(parseCurrencyBR(e.target.value))}
                />
              )}
            />
          </Field>

          {isGlobal && (
            <>
              <Field label="Nº Contrato">
                <input {...register('numero_contrato')} className={fieldCls} />
              </Field>
              <Field label="Nº Convênio">
                <input {...register('numero_convenio')} className={fieldCls} />
              </Field>
            </>
          )}
        </div>
      </section>

      {/* ── Descontos / Retenções (oculto para Receita Extra) ────────────── */}
      {showDescontos && (
        <section>
          <h3 style={sectionHead}>
            <span>Descontos / Retenções</span>
            <button
              type="button"
              aria-label="Adicionar retenção"
              onClick={() => addDesconto({ tipo: '', codigo: '', valor: 0, efd_codigo: '', ord: descontoFields.length })}
              className="text-xs rounded-lg border border-line text-ink-700 px-3 py-1.5 hover:bg-bg-soft transition font-medium"
            >
              + Adicionar
            </button>
          </h3>

          {descontoFields.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm" style={{ minWidth: 420 }}>
                <thead style={{ background: '#f6f8fb' }}>
                  <tr>
                    <th className="px-3 py-2.5 text-left col-hide-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', width: 110 }}>Código</th>
                    <th className="px-3 py-2.5 text-left" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>Tipo / Retenção</th>
                    <th className="px-3 py-2.5 text-right" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', width: 130 }}>Valor (R$)</th>
                    <th className="px-3 py-2.5 text-left col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', width: 130 }}>Código EFD</th>
                    <th className="px-3 py-2.5" style={{ borderBottom: '1px solid #e3e7ee', width: 36 }}></th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: 0 }}>
                  {descontoFields.map((field, i) => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #eef1f6' }}>
                      <td className="px-3 py-2 col-hide-sm">
                        <input
                          {...register(`descontos.${i}.codigo`)}
                          className={fieldCls}
                          placeholder="Cód."
                          onBlur={async (e) => {
                            const v = e.target.value.trim();
                            if (!v) return;
                            try {
                              const { data } = await supabase
                                .from('retencoes')
                                .select('nome')
                                .eq('codigo', v)
                                .maybeSingle();
                              if (data?.nome) setValue(`descontos.${i}.tipo`, data.nome);
                            } catch { /* manual */ }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Controller
                          control={control}
                          name={`descontos.${i}.tipo`}
                          render={({ field: f }) => (
                            <Combobox
                              value={f.value ?? ''}
                              onChange={async (val, opt) => {
                                f.onChange(val);
                                if (opt?.value) setValue(`descontos.${i}.codigo`, opt.value);
                              }}
                              onSearch={searchRetencoes}
                              placeholder="Digite para buscar..."
                              minChars={1}
                            />
                          )}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Controller
                          control={control}
                          name={`descontos.${i}.valor`}
                          render={({ field: f }) => (
                            <input
                              type="text"
                              inputMode="decimal"
                              className={cn(fieldCls, 'text-right')}
                              placeholder="0,00"
                              value={formatCurrencyBR(f.value)}
                              onChange={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                              onBlur={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                            />
                          )}
                        />
                      </td>
                      <td className="px-3 py-2 col-hide-mobile">
                        <Controller
                          control={control}
                          name={`descontos.${i}.efd_codigo`}
                          render={({ field: f }) => (
                            <Combobox
                              value={f.value ?? ''}
                              onChange={(val) => f.onChange(val)}
                              onSearch={searchEfd}
                              placeholder="EFD..."
                              minChars={1}
                            />
                          )}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeDesconto(i)}
                          className="text-accent-red hover:text-red-700 text-lg leading-none w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 transition"
                          aria-label="Remover desconto"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex flex-wrap justify-end gap-6 text-sm">
            <span className="text-ink-500">
              Total descontos: <span className="font-medium text-ink-900">R$ {formatCurrencyBR(totalDescontos)}</span>
            </span>
            <span className="text-ink-500">
              Valor líquido: <span className="font-semibold text-accent-blue">R$ {formatCurrencyBR(valorLiquido)}</span>
            </span>
          </div>
        </section>
      )}

      {/* ── Liquidação ────────────────────────────────────────────────────────── */}
      <section>
        <h3 style={{ ...sectionHead, justifyContent: 'flex-start' }}>Liquidação</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-lg border border-line p-4 bg-bg-soft">
          <Field label="Valor Liquidado (R$)">
            <Controller
              control={control}
              name="liquidacao.valor"
              render={({ field: f }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  className={fieldCls}
                  value={formatCurrencyBR(f.value ?? valorLiquido)}
                  onChange={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                  onBlur={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                />
              )}
            />
          </Field>

          {!isReceitaExtra && (
            <Field label="Data da Liquidação">
              <input type="date" {...register('liquidacao.data_liquidacao')} className={fieldCls} />
            </Field>
          )}

          <Field label={isReceitaExtra ? 'Data Recebimento' : 'Data Pagamento'}>
            <input type="date" {...register('liquidacao.data_pagamento')} className={fieldCls} />
          </Field>

          {!isReceitaExtra && (
            <Field label="Nº O.P.">
              <input {...register('liquidacao.numero_op')} className={fieldCls} />
            </Field>
          )}

          <Field label="Forma de Pagamento">
            <select {...register('liquidacao.forma_pagamento')} className={fieldCls}>
              <option value="">—</option>
              {Array.isArray(formasPagamento) && formasPagamento.map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {f.descricao || f.codigo}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-3">
            <Field label="Conta Bancária">
              <input {...register('liquidacao.conta')} className={fieldCls} />
            </Field>
          </div>
        </div>

        {/* Parcelas — ocultas para Receita Extra */}
        {!isReceitaExtra && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide" style={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.1em' }}>Parcelas</span>
              <button
                type="button"
                aria-label="Adicionar parcela"
                onClick={() =>
                  addParcela({ valor: 0, data: '', forma_pagamento: '', conta: '', numero_op: '', ord: parcelaFields.length })
                }
                className="text-xs rounded-lg border border-line text-ink-700 px-2.5 py-1.5 hover:bg-bg-soft transition font-medium"
              >
                + Parcela
              </button>
            </div>

            {parcelaFields.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-sm" style={{ minWidth: 360 }}>
                  <thead style={{ background: '#f6f8fb' }}>
                    <tr>
                      <th className="px-3 py-2.5 text-right" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', width: 130 }}>Valor (R$)</th>
                      <th className="px-3 py-2.5 text-left" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee', width: 130 }}>Data</th>
                      <th className="px-3 py-2.5 text-left col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>Forma</th>
                      <th className="px-3 py-2.5 text-left col-hide-mobile" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>Conta</th>
                      <th className="px-3 py-2.5 text-left col-hide-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee' }}>N.º O.P.</th>
                      <th className="px-3 py-2.5" style={{ borderBottom: '1px solid #e3e7ee', width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelaFields.map((field, i) => (
                      <tr key={field.id} style={{ borderBottom: '1px solid #eef1f6' }}>
                        <td className="px-3 py-2">
                          <Controller
                            control={control}
                            name={`liquidacao.parcelas.${i}.valor`}
                            render={({ field: f }) => (
                              <input
                                type="text"
                                inputMode="decimal"
                                className={cn(fieldCls, 'text-right')}
                                value={formatCurrencyBR(f.value)}
                                onChange={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                                onBlur={(e) => f.onChange(parseCurrencyBR(e.target.value))}
                              />
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="date" {...register(`liquidacao.parcelas.${i}.data`)} className={fieldCls} />
                        </td>
                        <td className="px-3 py-2 col-hide-mobile">
                          <select {...register(`liquidacao.parcelas.${i}.forma_pagamento`)} className={fieldCls}>
                            <option value="">—</option>
                            {Array.isArray(formasPagamento) && formasPagamento.map((f) => (
                              <option key={f.codigo} value={f.codigo}>
                                {f.descricao || f.codigo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 col-hide-mobile">
                          <input {...register(`liquidacao.parcelas.${i}.conta`)} className={fieldCls} />
                        </td>
                        <td className="px-3 py-2 col-hide-sm">
                          <input {...register(`liquidacao.parcelas.${i}.numero_op`)} className={fieldCls} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeParcela(i)}
                            className="text-accent-red hover:text-red-700 text-lg leading-none w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 transition"
                            aria-label="Remover parcela"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Ações ──────────────────────────────────────────────────────────────── */}
      <div className="form-actions-bar flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-700 hover:bg-bg-soft transition font-medium"
          >
            Cancelar
          </button>
        )}
        {!isEdit && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              saveAndNewRef.current = true;
              formRef.current?.requestSubmit();
            }}
            className="rounded-lg border border-ink-900 text-ink-900 px-6 py-2 text-sm font-semibold hover:bg-bg-soft transition disabled:opacity-50"
            title="Salvar e abrir formulário em branco (Ctrl+S salva e fecha)"
          >
            Salvar e Novo
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-ink-900 text-white px-6 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Empenho'}
        </button>
      </div>
    </form>
  );
}
