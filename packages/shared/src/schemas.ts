import { z } from 'zod';

// ─── Primitivos reutilizáveis ────────────────────────────────────────────────

const dateString = z
  .preprocess(
    (v) => (v === '' ? null : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').nullable(),
  )
  .optional();

const currencyValue = z.coerce.number().min(0).default(0);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

// ─── Perfil de Usuário ────────────────────────────────────────────────────────

export const RoleEnum = z.enum(['superadmin', 'admin', 'user', 'viewer']);
export type Role = z.infer<typeof RoleEnum>;

export const CriarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: RoleEnum.default('user'),
  departamento_id: z.coerce.number().int().positive().optional().nullable(),
});
export type CriarUsuarioDto = z.infer<typeof CriarUsuarioSchema>;

export const AtualizarUsuarioSchema = CriarUsuarioSchema.partial().extend({
  password: z.string().min(8).optional(),
  ativo: z.boolean().optional(),
});
export type AtualizarUsuarioDto = z.infer<typeof AtualizarUsuarioSchema>;

// ─── Departamento ─────────────────────────────────────────────────────────────

export const DepartamentoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  sigla: z.string().max(10).optional().nullable(),
  ativo: z.boolean().default(true),
});
export type DepartamentoDto = z.infer<typeof DepartamentoSchema>;

// ─── Credor ───────────────────────────────────────────────────────────────────

export const CredorSchema = z.object({
  numero: z.string().optional().nullable(),
  nome: z.string().min(2, 'Nome do credor é obrigatório'),
});
export type CredorDto = z.infer<typeof CredorSchema>;

// ─── Classificação Orçamentária ───────────────────────────────────────────────

export const ClassificacaoSchema = z.object({
  numero_ficha: z.string().min(1, 'Número da ficha é obrigatório'),
  projeto_atividade: z.string().optional().nullable(),
  dotacao: z.string().optional().nullable(),
  stn: z.string().optional().nullable(),
});
export type ClassificacaoDto = z.infer<typeof ClassificacaoSchema>;

// ─── Subelemento ─────────────────────────────────────────────────────────────

export const SubelementoSchema = z.object({
  natureza: z.string().min(1, 'Natureza é obrigatória'),
  sub: z
    .string()
    .min(1)
    .transform((v) => v.padStart(2, '0')),
  descricao: z.string().optional().nullable(),
});
export type SubelementoDto = z.infer<typeof SubelementoSchema>;

// ─── Retenção ─────────────────────────────────────────────────────────────────

export const RetencaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
});
export type RetencaoDto = z.infer<typeof RetencaoSchema>;

// ─── Forma de Pagamento ───────────────────────────────────────────────────────

export const FormaPagamentoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  descricao: z.string().optional().nullable(),
});
export type FormaPagamentoDto = z.infer<typeof FormaPagamentoSchema>;

// ─── Desconto ─────────────────────────────────────────────────────────────────

export const DescontoSchema = z.object({
  tipo: z.string().optional().nullable(),
  codigo: z.string().optional().nullable(),
  valor: currencyValue,
  efd_codigo: z.string().optional().nullable(),
  ord: z.number().int().default(0),
});
export type DescontoDto = z.infer<typeof DescontoSchema>;

// ─── Parcela ──────────────────────────────────────────────────────────────────

export const ParcelaSchema = z.object({
  valor: currencyValue,
  data: dateString,
  forma_pagamento: z.string().optional().nullable(),
  conta: z.string().optional().nullable(),
  numero_op: z.string().optional().nullable(),
  ord: z.number().int().default(0),
});
export type ParcelaDto = z.infer<typeof ParcelaSchema>;

// ─── Liquidação ───────────────────────────────────────────────────────────────

export const LiquidacaoSchema = z.object({
  valor: currencyValue,
  data_liquidacao: dateString,
  data_pagamento: dateString,
  numero_op: z.string().optional().nullable(),
  forma_pagamento: z.string().optional().nullable(),
  conta: z.string().optional().nullable(),
  parcelas: z.array(ParcelaSchema).default([]),
});
export type LiquidacaoDto = z.infer<typeof LiquidacaoSchema>;

// ─── Tipo de Empenho ──────────────────────────────────────────────────────────

export const TipoEmpenhoEnum = z.union([
  z.literal(1), // Ordinário
  z.literal(2), // Reexercício
  z.literal(3), // Global
]);

export const ExercicioEnum = z.union([
  z.literal(1), // Normal
  z.literal(2), // Superávit
]);

// ─── Empenho (principal) ─────────────────────────────────────────────────────

export const EmpenhoSchema = z.object({
  numero_ficha: z.string().optional().nullable(),
  projeto_atividade: z.string().optional().nullable(),
  dotacao: z.string().optional().nullable(),
  stn: z.string().optional().nullable(),
  subelemento_codigo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v.padStart(2, '0') : v)),
  subelemento_descricao: z.string().optional().nullable(),
  credor_id: z.coerce.number().int().positive().optional().nullable(),
  credor_numero: z.string().optional().nullable(),
  credor_nome: z.string().optional().nullable(),
  tipo_empenho: TipoEmpenhoEnum.default(1),
  historico: z.string().optional().nullable(),
  valor_empenho: currencyValue,
  emenda: z.coerce.number().int().optional().nullable(),
  exercicio: ExercicioEnum.default(1),
  numero_contrato: z.string().optional().nullable(),
  numero_convenio: z.string().optional().nullable(),
  data_empenho: dateString,
  departamento_id: z.coerce.number().int().positive().optional().nullable(),
  descontos: z.array(DescontoSchema).default([]),
  liquidacao: LiquidacaoSchema.optional().nullable(),
});
export type EmpenhoDto = z.infer<typeof EmpenhoSchema>;

// ─── Config QR ────────────────────────────────────────────────────────────────

export const QR_CAMPOS_DISPONIVEIS = [
  'id',
  'numero_ficha',
  'projeto_atividade',
  'dotacao',
  'stn',
  'subelemento_codigo',
  'subelemento_descricao',
  'credor_id',
  'credor_numero',
  'credor_nome',
  'tipo_empenho',
  'historico',
  'valor_empenho',
  'emenda',
  'exercicio',
  'numero_contrato',
  'numero_convenio',
  'data_empenho',
  'usuario_id',
  'usuario_nome',
  'created_at',
  'updated_at',
  'data_liquidacao',
  'data_pagamento',
  'conta_liquidacao',
  'numero_op_liquidacao',
  'forma_pagamento_liquidacao',
] as const;

export type QrCampo = (typeof QR_CAMPOS_DISPONIVEIS)[number];

export const ConfigQrSchema = z.object({
  campos: z
    .string()
    .or(z.array(z.string()).transform((arr) => arr.join(','))),
  separador: z.string().default(';'),
});
export type ConfigQrDto = z.infer<typeof ConfigQrSchema>;

// ─── Paginação ────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type PaginationDto = z.infer<typeof PaginationSchema>;

// ─── Filtros de Empenho ───────────────────────────────────────────────────────

export const EmpenhoFiltrosSchema = PaginationSchema.extend({
  q: z.string().optional(),
  interno: z.string().optional(),
  tipo: z.coerce.number().int().optional(),
  de: dateString,
  ate: dateString,
  departamento_id: z.coerce.number().int().optional(),
});
export type EmpenhoFiltrosDto = z.infer<typeof EmpenhoFiltrosSchema>;
