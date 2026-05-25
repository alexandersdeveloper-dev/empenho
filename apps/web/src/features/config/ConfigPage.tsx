import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { QR_CAMPOS_DISPONIVEIS, CriarUsuarioSchema, type CriarUsuarioDto } from '@ficha-empenho/shared';
import { apiClient } from '@/shared/lib/apiClient';
import { useAuthStore } from '@/shared/lib/authStore';
import type { Perfil, ConfigQr } from '@ficha-empenho/shared';

type Tab = 'qr' | 'obrigatorios' | 'usuarios';

// ─── QR Config ──────────────────────────────────────────────────────────────

const CAMPOS_LABELS: Record<string, string> = {
  id: 'ID',
  numero_ficha: 'Nº Ficha',
  projeto_atividade: 'Projeto/Atividade',
  dotacao: 'Dotação',
  stn: 'STN',
  subelemento_codigo: 'Sub-elemento Cód.',
  subelemento_descricao: 'Sub-elemento Desc.',
  credor_id: 'Credor ID',
  credor_numero: 'Credor Nº',
  credor_nome: 'Credor Nome',
  tipo_empenho: 'Tipo Empenho',
  historico: 'Histórico',
  valor_empenho: 'Valor Empenho',
  emenda: 'Emenda',
  exercicio: 'Exercício',
  numero_contrato: 'Nº Contrato',
  numero_convenio: 'Nº Convênio',
  data_empenho: 'Data Empenho',
  usuario_id: 'Usuário ID',
  usuario_nome: 'Usuário Nome',
  created_at: 'Criado Em',
  updated_at: 'Atualizado Em',
  data_liquidacao: 'Data Liquidação',
  data_pagamento: 'Data Pagamento',
  conta_liquidacao: 'Conta (Liq.)',
  numero_op_liquidacao: 'Nº OP (Liq.)',
  forma_pagamento_liquidacao: 'Forma Pgto (Liq.)',
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
  superadmin: 'Superadmin',
  admin: 'Admin',
  user: 'Usuário',
  viewer: 'Visualizador',
};

function QrConfigSection() {
  const qc = useQueryClient();

  const { data: config } = useQuery<ConfigQr>({
    queryKey: ['config-qr'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ConfigQr }>('/config/qr');
      return data.data;
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
      await apiClient.patch('/config/qr', {
        campos: camposSelecionados.join(','),
        separador,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config-qr'] });
      toast.success('Configuração de QR salva');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  function toggle(campo: string) {
    setCamposSelecionados((prev) =>
      prev.includes(campo) ? prev.filter((c) => c !== campo) : [...prev, campo],
    );
  }

  function moverCima(idx: number) {
    if (idx === 0) return;
    setCamposSelecionados((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moverBaixo(idx: number) {
    setCamposSelecionados((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Campos disponíveis */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Campos disponíveis</h3>
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {QR_CAMPOS_DISPONIVEIS.map((campo) => (
            <label
              key={campo}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
            >
              <input
                type="checkbox"
                checked={camposSelecionados.includes(campo)}
                onChange={() => toggle(campo)}
                className="rounded text-ink-900"
              />
              <span>{CAMPOS_LABELS[campo] ?? campo}</span>
              <span className="text-gray-400 text-xs ml-auto font-mono">{campo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ordem e separador */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Campos selecionados (na ordem)
        </h3>
        {camposSelecionados.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum campo selecionado</p>
        ) : (
          <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-64 overflow-y-auto mb-3">
            {camposSelecionados.map((campo, i) => (
              <li
                key={campo}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="text-gray-400 w-5 text-right text-xs">{i + 1}.</span>
                <span className="flex-1">{CAMPOS_LABELS[campo] ?? campo}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moverCima(i)}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                    title="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moverBaixo(i)}
                    disabled={i === camposSelecionados.length - 1}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1"
                    title="Mover para baixo"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => toggle(campo)}
                    className="text-red-400 hover:text-red-600 text-xs px-1"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Separador
          </label>
          <input
            value={separador}
            onChange={(e) => setSeparador(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-ink-900 outline-none font-mono"
            placeholder=";"
          />
          <p className="text-xs text-gray-400 mt-1">Use \t para tabulação</p>
        </div>

        <button
          onClick={() => salvar.mutate()}
          disabled={salvar.isPending}
          className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60"
        >
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
      const { data } = await apiClient.get('/config/obrigatorios');
      return data;
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
      await apiClient.patch('/config/obrigatorios', { campos: selecionados.join(',') });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campos-obrigatorios'] });
      toast.success('Campos obrigatórios salvos');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  function toggle(key: string) {
    setSelecionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  return (
    <div className="max-w-md">
      <p className="text-sm text-gray-500 mb-4">
        Campos marcados serão obrigatórios ao salvar um empenho (exceto no modo Superávit).
      </p>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 mb-4">
        {CAMPOS_OBRIGATORIOS_OPTS.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selecionados.includes(key)}
              onChange={() => toggle(key)}
              className="rounded text-ink-900"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      <button
        onClick={() => salvar.mutate()}
        disabled={salvar.isPending}
        className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60"
      >
        {salvar.isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  );
}

function UsuariosSection() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  const { data: usuarios = [], isLoading } = useQuery<Perfil[]>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await apiClient.get<Perfil[]>('/users');
      return data;
    },
  });

  const { data: departamentos = [] } = useQuery<Array<{ id: number; nome: string }>>({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const { data } = await apiClient.get('/departamentos');
      return data;
    },
  });

  const criar = useMutation({
    mutationFn: async (dto: CriarUsuarioDto) => {
      await apiClient.post('/users', dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado');
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Erro ao criar usuário';
      toast.error(msg);
    },
  });

  const desativar = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário desativado');
    },
    onError: () => toast.error('Erro ao desativar usuário'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CriarUsuarioDto>({
    resolver: zodResolver(CriarUsuarioSchema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = (dto: CriarUsuarioDto) => criar.mutateAsync(dto);

  const isCriar = showForm;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Gerencie os usuários do sistema.</p>
        <button
          onClick={() => { setShowForm(!showForm); reset(); }}
          className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold hover:bg-ink-700 transition"
        >
          {isCriar ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-gray-200 p-4 mb-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h3 className="md:col-span-2 text-sm font-semibold text-gray-700">Novo Usuário</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
            <input {...register('nome')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ink-900" />
            {errors.nome && <p className="text-xs text-red-500 mt-0.5">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
            <input type="email" {...register('email')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ink-900" />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
            <input type="password" {...register('password')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ink-900" />
            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Perfil</label>
            <select {...register('role')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ink-900 bg-white">
              <option value="viewer">Visualizador</option>
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
              {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
            <select {...register('departamento_id', { setValueAs: (v) => v ? Number(v) : null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ink-900 bg-white">
              <option value="">— nenhum —</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-ink-900 text-white px-5 py-2 text-sm font-semibold hover:bg-ink-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Criando…' : 'Criar usuário'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Departamento</th>
                <th className="px-4 py-3 text-center">Ativo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {(u.departamento as { nome?: string } | undefined)?.nome ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.ativo ? (
                      <span className="text-green-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-red-500">Não</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && u.ativo && (
                      <button
                        onClick={() => {
                          if (confirm(`Desativar ${u.nome}?`)) desativar.mutate(u.id);
                        }}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Desativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ConfigPage() {
  const [tab, setTab] = useState<Tab>('qr');

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'qr', label: 'QR Code' },
    { key: 'obrigatorios', label: 'Campos Obrigatórios' },
    { key: 'usuarios', label: 'Usuários' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#0f1622' }}>
          Configurações
        </h2>
        <p style={{ fontSize: 14, color: '#5b667a', margin: 0 }}>
          Personalize campos, QR codes e acesso de usuários.
        </p>
      </div>

      {/* Scrollable tab bar */}
      <div className="tabs-scroll mb-6" style={{ borderBottom: '1px solid #e3e7ee' }}>
        <div className="flex gap-0 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 18px',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'Manrope, system-ui, sans-serif',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: `2px solid ${tab === t.key ? '#0f1622' : 'transparent'}`,
                marginBottom: -1,
                color: tab === t.key ? '#0f1622' : '#5b667a',
                background: 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color .15s',
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
    </div>
  );
}
