"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpenhoFiltrosSchema = exports.PaginationSchema = exports.ConfigQrSchema = exports.QR_CAMPOS_DISPONIVEIS = exports.EmpenhoSchema = exports.ExercicioEnum = exports.TipoEmpenhoEnum = exports.LiquidacaoSchema = exports.ParcelaSchema = exports.DescontoSchema = exports.FormaPagamentoSchema = exports.RetencaoSchema = exports.SubelementoSchema = exports.ClassificacaoSchema = exports.CredorSchema = exports.DepartamentoSchema = exports.AtualizarUsuarioSchema = exports.CriarUsuarioSchema = exports.RoleEnum = exports.LoginSchema = void 0;
const zod_1 = require("zod");
const dateString = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .nullable()
    .optional();
const currencyValue = zod_1.z.coerce.number().min(0).default(0);
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
exports.RoleEnum = zod_1.z.enum(['superadmin', 'admin', 'user', 'viewer']);
exports.CriarUsuarioSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, 'Nome é obrigatório'),
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    role: exports.RoleEnum.default('user'),
    departamento_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
});
exports.AtualizarUsuarioSchema = exports.CriarUsuarioSchema.partial().extend({
    password: zod_1.z.string().min(8).optional(),
    ativo: zod_1.z.boolean().optional(),
});
exports.DepartamentoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, 'Nome é obrigatório'),
    sigla: zod_1.z.string().max(10).optional().nullable(),
    ativo: zod_1.z.boolean().default(true),
});
exports.CredorSchema = zod_1.z.object({
    numero: zod_1.z.string().optional().nullable(),
    nome: zod_1.z.string().min(2, 'Nome do credor é obrigatório'),
});
exports.ClassificacaoSchema = zod_1.z.object({
    numero_ficha: zod_1.z.string().min(1, 'Número da ficha é obrigatório'),
    projeto_atividade: zod_1.z.string().optional().nullable(),
    dotacao: zod_1.z.string().optional().nullable(),
    stn: zod_1.z.string().optional().nullable(),
});
exports.SubelementoSchema = zod_1.z.object({
    natureza: zod_1.z.string().min(1, 'Natureza é obrigatória'),
    sub: zod_1.z
        .string()
        .min(1)
        .transform((v) => v.padStart(2, '0')),
    descricao: zod_1.z.string().optional().nullable(),
});
exports.RetencaoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1, 'Nome é obrigatório'),
    codigo: zod_1.z.string().min(1, 'Código é obrigatório'),
});
exports.FormaPagamentoSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1, 'Código é obrigatório'),
    descricao: zod_1.z.string().optional().nullable(),
});
exports.DescontoSchema = zod_1.z.object({
    tipo: zod_1.z.string().optional().nullable(),
    codigo: zod_1.z.string().optional().nullable(),
    valor: currencyValue,
    efd_codigo: zod_1.z.string().optional().nullable(),
    ord: zod_1.z.number().int().default(0),
});
exports.ParcelaSchema = zod_1.z.object({
    valor: currencyValue,
    data: dateString,
    forma_pagamento: zod_1.z.string().optional().nullable(),
    conta: zod_1.z.string().optional().nullable(),
    numero_op: zod_1.z.string().optional().nullable(),
    ord: zod_1.z.number().int().default(0),
});
exports.LiquidacaoSchema = zod_1.z.object({
    valor: currencyValue,
    data_liquidacao: dateString,
    data_pagamento: dateString,
    numero_op: zod_1.z.string().optional().nullable(),
    forma_pagamento: zod_1.z.string().optional().nullable(),
    conta: zod_1.z.string().optional().nullable(),
    parcelas: zod_1.z.array(exports.ParcelaSchema).default([]),
});
exports.TipoEmpenhoEnum = zod_1.z.union([
    zod_1.z.literal(1),
    zod_1.z.literal(2),
    zod_1.z.literal(3),
]);
exports.ExercicioEnum = zod_1.z.union([
    zod_1.z.literal(1),
    zod_1.z.literal(2),
]);
exports.EmpenhoSchema = zod_1.z.object({
    numero_ficha: zod_1.z.string().optional().nullable(),
    projeto_atividade: zod_1.z.string().optional().nullable(),
    dotacao: zod_1.z.string().optional().nullable(),
    stn: zod_1.z.string().optional().nullable(),
    subelemento_codigo: zod_1.z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v ? v.padStart(2, '0') : v)),
    subelemento_descricao: zod_1.z.string().optional().nullable(),
    credor_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    credor_numero: zod_1.z.string().optional().nullable(),
    credor_nome: zod_1.z.string().optional().nullable(),
    tipo_empenho: exports.TipoEmpenhoEnum.default(1),
    historico: zod_1.z.string().optional().nullable(),
    valor_empenho: currencyValue,
    emenda: zod_1.z.coerce.number().int().optional().nullable(),
    exercicio: exports.ExercicioEnum.default(1),
    numero_contrato: zod_1.z.string().optional().nullable(),
    numero_convenio: zod_1.z.string().optional().nullable(),
    data_empenho: dateString,
    departamento_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    descontos: zod_1.z.array(exports.DescontoSchema).default([]),
    liquidacao: exports.LiquidacaoSchema.optional().nullable(),
});
exports.QR_CAMPOS_DISPONIVEIS = [
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
];
exports.ConfigQrSchema = zod_1.z.object({
    campos: zod_1.z
        .string()
        .or(zod_1.z.array(zod_1.z.string()).transform((arr) => arr.join(','))),
    separador: zod_1.z.string().default(';'),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
});
exports.EmpenhoFiltrosSchema = exports.PaginationSchema.extend({
    q: zod_1.z.string().optional(),
    interno: zod_1.z.string().optional(),
    tipo: zod_1.z.coerce.number().int().optional(),
    de: dateString,
    ate: dateString,
    departamento_id: zod_1.z.coerce.number().int().optional(),
});
//# sourceMappingURL=schemas.js.map