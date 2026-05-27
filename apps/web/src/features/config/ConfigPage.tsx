import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  QR_CAMPOS_DISPONIVEIS,
  CriarUsuarioSchema,
  DepartamentoSchema,
  type CriarUsuarioDto,
  type DepartamentoDto,
} from '@ficha-empenho/shared';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuthStore } from '@/shared/lib/authStore';
import { edgeFnError } from '@/shared/lib/edgeFnError';
import { ConfirmActionModal } from '@/shared/components/ConfirmActionModal';
import { PageHeader } from '@/shared/components/PageHeader';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import type { Perfil, ConfigQr } from '@ficha-empenho/shared';

type Tab = 'qr' | 'obrigatorios' | 'usuarios' | 'secretarias';

// ─── Helpers de estilo ────────────────────────────────────────────────────────

const fieldCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-ink-900 focus:ring-1 focus:ring-ink-300 outline-none bg-white text-ink-900 placeholder:text-ink-400 transition';
const labelCls = 'block text-xs font-medium text-ink-500 mb-1';
const errorCls = 'text-xs text-accent-red mt-0.5';

const thStyle: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#5b667a', fontWeight: 500, borderBottom: '1px solid #e3e7ee',
};

// ─── QR Config ────────────────────────────────────────────────────────────────

const CAMPOS_LABELS: Record<string, string> = {
  id: 'ID', numero_ficha: 'Nº Ficha', projeto_atividade: 'Projeto/Atividade',
  dotacao: 'Dotação', stn: 'STN', subelemento_codigo: 'Sub-elemento Cód.',
  subelemento_descricao: 'Sub-elemento Desc.', credor_id: 'Credor ID',
  credor_numero: 'Credor Nº', credor_nome: 'Credor Nome', tipo_empenho: 'Tipo Empenho',
  historico: 'Histórico', valor_empenho: 'Valor Empenho', emenda: 'Emenda',
  exercicio: 'Exercício', numero_contrato: 'Nº Contrato', numero_convenio: 'Nº Convênio',
  data_empenho: 'Data Empenho', usuario_id: 'Usuário ID', usuario_nome: 'Usuário Nome',
  created_at: 'Criado Em', updated_at: 'Atualizado Em', data_liquidacao: 'Data Liquidação',
  data_pagamento: 'Data Pagamento', conta_liquidacao: 'Conta (Liq.)',
  numero_op_liquidacao: 'Nº OP (Liq.)', forma_pagamento_liquidacao: 'Forma Pgto (Liq.)',
};

const CAMPOS_OBRIGATORIOS_OPTS = [
  { key: 'numero_ficha', label: 'Nº Ficha' },
  { key: 'projeto_atividade', label: 'Projeto/Atividade' },
  { key: 'dotacao', label: 'Dotação' },
  { key: 'stn', label: 'STN' },
  { key: 'subelemento_codigo', label: 'Sub-elemento' },
  { key: 'credor_id', label: 'Credor' },
  { key: 'historico', label: 'Histórico' },
  { key: 'valor_empenho', label: 'Valor Empenho' },
  { key: 'data_empenho', label: 'Data Empenho' },
  { key: 'emenda', label: 'Emenda' },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin', admin: 'Admin', user: 'Usuário', viewer: 'Visualizador',
};

function QrConfigSection() {
  const qc = useQueryClient();
  const { data: config } = useQuery<ConfigQr>({
    queryKey: ['config-qr'],
    queryFn: async () => {
      const { data, error } = await supabase.from('config_qr').select('*').eq('id', 1).single();
      if (error) throw new Error(error.message);
      return data as ConfigQr;
    },
  });

  const [camposSelecionados, setCamposSelecionados] = useState<string[]>([]);
  const [separador, setSeparador] = useState(';');
  const [loaded, setLoaded] = useState(false);

  if (config && !loaded) {
    setCamposSelecionados(config.campos ? config.campos.split(',').filter(Boolean) : []);
    setSeparador(config.separador ?? ';');
    setLoaded(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('config_qr')
        .update({ campos: camposSelecionados.join(','), separador })
        .eq('id', 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config-qr'] }); toast.success('Configuração de QR salva'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  function toggle(campo: string) {
    setCamposSelecionados((prev) =>
      prev.includes(campo) ? prev.filter((c) => c !== campo) : [...prev, campo],
    );
  }
  function moverCima(idx: number) {
    if (idx === 0) return;
    setCamposSelecionados((prev) => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n; });
  }
  function moverBaixo(idx: number) {
    setCamposSelecionados((prev) => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n;
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-ink-700 mb-2">Campos disponíveis</h3>
        <div className="rounded-lg border border-line divide-y divide-line max-h-72 overflow-y-auto">
          {QR_CAMPOS_DISPONIVEIS.map((campo) => (
            <label key={campo} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-soft text-sm">
              <input type="checkbox" checked={camposSelecionados.includes(campo)} onChange={() => toggle(campo)} className="rounded" />
              <span className="text-ink-700">{CAMPOS_LABELS[campo] ?? campo}</span>
              <span className="text-ink-400 text-xs ml-auto font-mono">{campo}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-700 mb-2">Campos selecionados (na ordem)</h3>
        {camposSelecionados.length === 0 ? (
          <p className="text-sm text-ink-400 italic">Nenhum campo selecionado</p>
        ) : (
          <ul className="rounded-lg border border-line divide-y divide-line max-h-64 overflow-y-auto mb-3">
            {camposSelecionados.map((campo, i) => (
              <li key={campo} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="text-ink-400 w-5 text-right text-xs">{i+1}.</span>
                <span className="flex-1 text-ink-700">{CAMPOS_LABELS[campo] ?? campo}</span>
                <div className="flex gap-1">
                  <button onClick={() => moverCima(i)} disabled={i===0} className="text-ink-400 hover:text-ink-700 disabled:opacity-30 text-xs px-1">▲</button>
                  <button onClick={() => moverBaixo(i)} disabled={i===camposSelecionados.length-1} className="text-ink-400 hover:text-ink-700 disabled:opacity-30 text-xs px-1">▼</button>
                  <button onClick={() => toggle(campo)} className="text-accent-red hover:text-red-700 text-xs px-1">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mb-4">
          <label className={labelCls}>Separador</label>
          <input value={separador} onChange={(e) => setSeparador(e.target.value)} className="w-32 rounded-lg border border-line px-3 py-1.5 text-sm focus:border-ink-900 outline-none font-mono" placeholder=";" />
          <p className="text-xs text-ink-400 mt-1">Use \t para tabulação</p>
        </div>
        <button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60">
          {salvar.isPending ? 'Salvando…' : 'Salvar configuração QR'}
        </button>
      </div>
    </div>
  );
}

function CamposObrigatoriosSection() {
  const qc = useQueryClient();
  const { data } = useQuery<{ campos: string }>({
    queryKey: ['campos-obrigatorios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos_obrigatorios')
        .select('campos')
        .eq('id', 1)
        .single();
      if (error) throw new Error(error.message);
      return data as { campos: string };
    },
  });
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (data && !loaded) {
    setSelecionados(data.campos ? data.campos.split(',').filter(Boolean) : []);
    setLoaded(true);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('campos_obrigatorios')
        .update({ campos: selecionados.join(',') })
        .eq('id', 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campos-obrigatorios'] }); toast.success('Campos obrigatórios salvos'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  function toggle(key: string) {
    setSelecionados((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  return (
    <div className="max-w-md">
      <p className="text-sm text-ink-500 mb-4">Campos marcados serão obrigatórios ao salvar um empenho (exceto no modo Superávit).</p>
      <div className="rounded-lg border border-line divide-y divide-line mb-4">
        {CAMPOS_OBRIGATORIOS_OPTS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-bg-soft">
            <input type="checkbox" checked={selecionados.includes(key)} onChange={() => toggle(key)} className="rounded" />
            <span className="text-sm text-ink-700">{label}</span>
          </label>
        ))}
      </div>
      <button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60">
        {salvar.isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  );
}

// ─── Secretarias ──────────────────────────────────────────────────────────────

type Secretaria = { id: number; nome: string; sigla: string | null; ativo: boolean };

function SecretariasSection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ id: number; nome: string; ativo: boolean } | null>(null);

  const { data: secretarias = [], isLoading } = useQuery<Secretaria[]>({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .order('nome');
      if (error) throw new Error(error.message);
      return (data ?? []) as Secretaria[];
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd, isSubmitting: isAddSubmitting },
  } = useForm<DepartamentoDto>({ resolver: zodResolver(DepartamentoSchema) });

  const {
    register: registerEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit, isSubmitting: isEditSubmitting },
  } = useForm<DepartamentoDto>({ resolver: zodResolver(DepartamentoSchema) });

  const criar = useMutation({
    mutationFn: async (dto: DepartamentoDto) => {
      const { error } = await supabase.from('departamentos').insert({ ...dto, ativo: true });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departamentos'] });
      toast.success('Secretaria criada');
      setShowForm(false);
      resetAdd();
    },
    onError: () => toast.error('Erro ao criar secretaria'),
  });

  const editar = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: DepartamentoDto }) => {
      const { error } = await supabase.from('departamentos').update(dto).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departamentos'] });
      toast.success('Secretaria atualizada');
      setEditId(null);
    },
    onError: () => toast.error('Erro ao atualizar secretaria'),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) => {
      const { error } = await supabase.from('departamentos').update({ ativo }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departamentos'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  function startEdit(s: Secretaria) {
    setEditId(s.id);
    resetEdit({ nome: s.nome, sigla: s.sigla ?? '', ativo: s.ativo });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-500">Secretarias disponíveis para associar aos usuários.</p>
        <button
          onClick={() => { setShowForm(!showForm); resetAdd(); setEditId(null); }}
          className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Nova Secretaria'}
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form
          onSubmit={handleAdd((dto) => criar.mutateAsync(dto))}
          className="rounded-xl border border-line p-4 mb-5 bg-bg-soft grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <h3 style={{ fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#0f1622', gridColumn: '1 / -1', margin: 0 }}>
            Nova Secretaria
          </h3>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome <span className="text-accent-red">*</span></label>
            <input {...registerAdd('nome')} className={fieldCls} placeholder="Ex: Secretaria de Finanças" />
            {errorsAdd.nome && <p className={errorCls}>{errorsAdd.nome.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Sigla</label>
            <input {...registerAdd('sigla')} className={fieldCls} placeholder="Ex: SEFIN" maxLength={10} />
            {errorsAdd.sigla && <p className={errorCls}>{errorsAdd.sigla.message}</p>}
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isAddSubmitting}
              className="rounded-lg bg-ink-900 text-white px-5 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60"
            >
              {isAddSubmitting ? 'Criando…' : 'Criar Secretaria'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead style={{ background: '#f6f8fb' }}>
            <tr>
              <th className="px-4 py-3 text-left" style={thStyle}>Nome</th>
              <th className="px-4 py-3 text-left col-hide-sm" style={thStyle}>Sigla</th>
              <th className="px-4 py-3 text-center col-hide-sm" style={thStyle}>Ativo</th>
              <th className="px-4 py-3 text-right" style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={5} cols={[
                { width: 'w-3/4' },
                { width: 'w-16', hidden: 'sm' },
                { width: 'w-8', hidden: 'sm' },
                { width: 'w-20' },
              ]} />
            ) : (
              <>
                {secretarias.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-ink-400 text-sm">
                      Nenhuma secretaria cadastrada
                    </td>
                  </tr>
                )}
                {secretarias.map((s) => (
                  editId === s.id ? (
                  /* Linha de edição inline */
                  <tr key={s.id} style={{ borderBottom: '1px solid #eef1f6', background: '#f6f8fb' }}>
                    <td className="px-3 py-2" colSpan={2}>
                      <form
                        id={`edit-form-${s.id}`}
                        onSubmit={handleEdit((dto) => editar.mutateAsync({ id: s.id, dto }))}
                        className="flex gap-2 flex-wrap"
                      >
                        <div className="flex-1 min-w-[160px]">
                          <input {...registerEdit('nome')} className={fieldCls} placeholder="Nome" />
                          {errorsEdit.nome && <p className={errorCls}>{errorsEdit.nome.message}</p>}
                        </div>
                        <div className="w-28">
                          <input {...registerEdit('sigla')} className={fieldCls} placeholder="Sigla" maxLength={10} />
                        </div>
                      </form>
                    </td>
                    <td className="px-4 py-2 text-center col-hide-sm" />
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          type="submit"
                          form={`edit-form-${s.id}`}
                          disabled={isEditSubmitting}
                          className="px-2.5 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-ink-700 transition disabled:opacity-60"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="px-2.5 py-1.5 rounded-lg border border-line text-ink-700 text-xs font-medium hover:bg-bg-soft transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* Linha normal */
                  <tr key={s.id} className={`hover:bg-bg-soft transition ${!s.ativo ? 'opacity-50' : ''}`} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td className="px-4 py-3 font-medium text-ink-900">{s.nome}</td>
                    <td className="px-4 py-3 text-ink-500 font-mono text-xs col-hide-sm">{s.sigla ?? '—'}</td>
                    <td className="px-4 py-3 text-center col-hide-sm">
                      {s.ativo
                        ? <span style={{ color: '#1f7a3f', fontWeight: 600, fontSize: 12 }}>Sim</span>
                        : <span style={{ color: '#8b2424', fontSize: 12 }}>Não</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(s)}
                          className="px-2.5 py-1.5 rounded-lg text-accent-blue hover:bg-[#eaf4ff] text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setPendingToggle({ id: s.id, nome: s.nome, ativo: s.ativo })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:bg-bg-soft-2 text-ink-500"
                        >
                          {s.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmActionModal
        open={pendingToggle !== null}
        title={pendingToggle?.ativo ? 'Desativar secretaria' : 'Ativar secretaria'}
        description={
          pendingToggle?.ativo
            ? `"${pendingToggle.nome}" ficará indisponível para novos empenhos. Esta ação pode ser revertida.`
            : `"${pendingToggle?.nome ?? ''}" voltará a ficar disponível para associação de usuários.`
        }
        confirmLabel={pendingToggle?.ativo ? 'Desativar' : 'Ativar'}
        variant={pendingToggle?.ativo ? 'warning' : 'info'}
        isLoading={toggleAtivo.isPending}
        onConfirm={() => {
          if (!pendingToggle) return;
          toggleAtivo.mutate(
            { id: pendingToggle.id, ativo: !pendingToggle.ativo },
            { onSuccess: () => setPendingToggle(null) },
          );
        }}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

function UsuariosSection() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);
  const [pendingDesativar, setPendingDesativar] = useState<{ id: string; nome: string } | null>(null);

  const { data: usuarios = [], isLoading } = useQuery<Perfil[]>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*, departamento:departamentos(id, nome, sigla)')
        .order('nome');
      if (error) throw new Error(error.message);
      return (data ?? []) as Perfil[];
    },
  });

  const { data: secretarias = [] } = useQuery<Array<{ id: number; nome: string }>>({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departamentos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const criar = useMutation({
    mutationFn: async (dto: CriarUsuarioDto) => {
      const { error } = await supabase.functions.invoke('usuario-mutate', {
        body: { action: 'criar', ...dto },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado');
      setShowForm(false);
      reset();
    },
    onError: (err: unknown) => {
      toast.error(edgeFnError(err));
    },
  });

  const desativar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('usuario-mutate', {
        body: { action: 'desativar', id },
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuário desativado'); },
    onError: (err: unknown) => { toast.error(edgeFnError(err)); },
  });

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<CriarUsuarioDto>({
    resolver: zodResolver(CriarUsuarioSchema),
    defaultValues: { role: 'user' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-500">Gerencie os usuários do sistema.</p>
        <button
          onClick={() => { setShowForm(!showForm); reset(); }}
          className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((dto) => criar.mutateAsync(dto))}
          className="rounded-xl border border-line p-4 mb-6 bg-bg-soft grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h3 style={{ fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#0f1622', gridColumn: '1 / -1', margin: 0 }}>
            Novo Usuário
          </h3>

          <div>
            <label className={labelCls}>Nome completo</label>
            <input {...register('nome')} className={fieldCls} />
            {errors.nome && <p className={errorCls}>{errors.nome.message}</p>}
          </div>

          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" {...register('email')} className={fieldCls} />
            {errors.email && <p className={errorCls}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Senha</label>
            <input type="password" {...register('password')} className={fieldCls} />
            {errors.password && <p className={errorCls}>{errors.password.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Perfil</label>
            <select {...register('role')} className={fieldCls}>
              <option value="viewer">Visualizador</option>
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
              {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Secretaria</label>
            <select
              {...register('departamento_id', { setValueAs: (v) => v ? Number(v) : null })}
              className={fieldCls}
            >
              <option value="">— nenhuma —</option>
              {secretarias.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-ink-900 text-white px-5 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Criando…' : 'Criar usuário'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead style={{ background: '#f6f8fb' }}>
            <tr>
              <th className="px-4 py-3 text-left" style={thStyle}>Nome</th>
              <th className="px-4 py-3 text-left col-hide-sm" style={thStyle}>E-mail</th>
              <th className="px-4 py-3 text-left" style={thStyle}>Perfil</th>
              <th className="px-4 py-3 text-left col-hide-mobile" style={thStyle}>Secretaria</th>
              <th className="px-4 py-3 text-center col-hide-sm" style={thStyle}>Ativo</th>
              <th className="px-4 py-3 text-right" style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={5} cols={[
                { width: 'w-1/3' },
                { width: 'w-1/2', hidden: 'sm' },
                { width: 'w-16' },
                { width: 'w-32', hidden: 'mobile' },
                { width: 'w-8', hidden: 'sm' },
                { width: 'w-16' },
              ]} />
            ) : (
              <>
                {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-bg-soft transition ${!u.ativo ? 'opacity-50' : ''}`}
                  style={{ borderBottom: '1px solid #eef1f6' }}
                >
                  <td className="px-4 py-3 font-medium text-ink-900 text-sm">{u.nome}</td>
                  <td className="px-4 py-3 text-ink-500 text-sm col-hide-sm truncate max-w-[180px]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999, background: '#eaf4ff', color: '#1a5fa8', fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: 500 }}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-sm col-hide-mobile">
                    {(u.departamento as { nome?: string } | undefined)?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center col-hide-sm">
                    {u.ativo
                      ? <span style={{ color: '#1f7a3f', fontWeight: 600, fontSize: 12 }}>Sim</span>
                      : <span style={{ color: '#8b2424', fontSize: 12 }}>Não</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && u.ativo && (
                      <button
                        onClick={() => setPendingDesativar({ id: u.id, nome: u.nome })}
                        className="text-accent-red hover:underline text-xs font-medium"
                      >
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmActionModal
        open={pendingDesativar !== null}
        title="Desativar usuário"
        description={`${pendingDesativar?.nome ?? ''} perderá acesso ao sistema imediatamente. Esta ação pode ser revertida pelo administrador.`}
        confirmLabel="Desativar usuário"
        variant="danger"
        isLoading={desativar.isPending}
        onConfirm={() => {
          if (!pendingDesativar) return;
          desativar.mutate(pendingDesativar.id, {
            onSuccess: () => setPendingDesativar(null),
          });
        }}
        onCancel={() => setPendingDesativar(null)}
      />
    </div>
  );
}

// ─── ConfigPage ───────────────────────────────────────────────────────────────

export function ConfigPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';
  const [tab, setTab] = useState<Tab>('qr');

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'qr', label: 'QR Code' },
    { key: 'obrigatorios', label: 'Campos Obrigatórios' },
    { key: 'usuarios', label: 'Usuários' },
    ...(isSuperAdmin ? [{ key: 'secretarias' as Tab, label: 'Secretarias' }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Personalize campos, QR codes e acesso de usuários."
      />

      <div className="tabs-scroll mb-6" style={{ borderBottom: '1px solid #e3e7ee' }}>
        <div className="flex gap-0 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 18px', fontSize: 13.5, fontWeight: 600,
                fontFamily: 'Manrope, system-ui, sans-serif',
                border: 'none',
                borderBottom: `2px solid ${tab === t.key ? '#0f1622' : 'transparent'}`,
                marginBottom: -1,
                color: tab === t.key ? '#0f1622' : '#5b667a',
                background: 'transparent', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'color .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'qr' && <QrConfigSection />}
      {tab === 'obrigatorios' && <CamposObrigatoriosSection />}
      {tab === 'usuarios' && <UsuariosSection />}
      {tab === 'secretarias' && isSuperAdmin && <SecretariasSection />}
    </div>
  );
}
