import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof LoginSchema>;
export declare const RoleEnum: z.ZodEnum<["superadmin", "admin", "user", "viewer"]>;
export type Role = z.infer<typeof RoleEnum>;
export declare const CriarUsuarioSchema: z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["superadmin", "admin", "user", "viewer"]>>;
    departamento_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    nome: string;
    password: string;
    role: "superadmin" | "admin" | "user" | "viewer";
    departamento_id?: number | null | undefined;
}, {
    email: string;
    nome: string;
    password: string;
    role?: "superadmin" | "admin" | "user" | "viewer" | undefined;
    departamento_id?: number | null | undefined;
}>;
export type CriarUsuarioDto = z.infer<typeof CriarUsuarioSchema>;
export declare const AtualizarUsuarioSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["superadmin", "admin", "user", "viewer"]>>>;
    departamento_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
} & {
    password: z.ZodOptional<z.ZodString>;
    ativo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    nome?: string | undefined;
    password?: string | undefined;
    role?: "superadmin" | "admin" | "user" | "viewer" | undefined;
    departamento_id?: number | null | undefined;
    ativo?: boolean | undefined;
}, {
    email?: string | undefined;
    nome?: string | undefined;
    password?: string | undefined;
    role?: "superadmin" | "admin" | "user" | "viewer" | undefined;
    departamento_id?: number | null | undefined;
    ativo?: boolean | undefined;
}>;
export type AtualizarUsuarioDto = z.infer<typeof AtualizarUsuarioSchema>;
export declare const DepartamentoSchema: z.ZodObject<{
    nome: z.ZodString;
    sigla: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ativo: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    ativo: boolean;
    sigla?: string | null | undefined;
}, {
    nome: string;
    sigla?: string | null | undefined;
    ativo?: boolean | undefined;
}>;
export type DepartamentoDto = z.infer<typeof DepartamentoSchema>;
export declare const CredorSchema: z.ZodObject<{
    numero: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nome: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nome: string;
    numero?: string | null | undefined;
}, {
    nome: string;
    numero?: string | null | undefined;
}>;
export type CredorDto = z.infer<typeof CredorSchema>;
export declare const ClassificacaoSchema: z.ZodObject<{
    numero_ficha: z.ZodString;
    projeto_atividade: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dotacao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    stn: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    numero_ficha: string;
    projeto_atividade?: string | null | undefined;
    dotacao?: string | null | undefined;
    stn?: string | null | undefined;
}, {
    numero_ficha: string;
    projeto_atividade?: string | null | undefined;
    dotacao?: string | null | undefined;
    stn?: string | null | undefined;
}>;
export type ClassificacaoDto = z.infer<typeof ClassificacaoSchema>;
export declare const SubelementoSchema: z.ZodObject<{
    natureza: z.ZodString;
    sub: z.ZodEffects<z.ZodString, string, string>;
    descricao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    sub: string;
    natureza: string;
    descricao?: string | null | undefined;
}, {
    sub: string;
    natureza: string;
    descricao?: string | null | undefined;
}>;
export type SubelementoDto = z.infer<typeof SubelementoSchema>;
export declare const RetencaoSchema: z.ZodObject<{
    nome: z.ZodString;
    codigo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nome: string;
    codigo: string;
}, {
    nome: string;
    codigo: string;
}>;
export type RetencaoDto = z.infer<typeof RetencaoSchema>;
export declare const FormaPagamentoSchema: z.ZodObject<{
    codigo: z.ZodString;
    descricao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    codigo: string;
    descricao?: string | null | undefined;
}, {
    codigo: string;
    descricao?: string | null | undefined;
}>;
export type FormaPagamentoDto = z.infer<typeof FormaPagamentoSchema>;
export declare const DescontoSchema: z.ZodObject<{
    tipo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    codigo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    valor: z.ZodDefault<z.ZodNumber>;
    efd_codigo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ord: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    valor: number;
    ord: number;
    codigo?: string | null | undefined;
    tipo?: string | null | undefined;
    efd_codigo?: string | null | undefined;
}, {
    codigo?: string | null | undefined;
    tipo?: string | null | undefined;
    valor?: number | undefined;
    efd_codigo?: string | null | undefined;
    ord?: number | undefined;
}>;
export type DescontoDto = z.infer<typeof DescontoSchema>;
export declare const ParcelaSchema: z.ZodObject<{
    valor: z.ZodDefault<z.ZodNumber>;
    data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    forma_pagamento: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    conta: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    numero_op: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ord: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    valor: number;
    ord: number;
    data?: string | null | undefined;
    forma_pagamento?: string | null | undefined;
    conta?: string | null | undefined;
    numero_op?: string | null | undefined;
}, {
    data?: string | null | undefined;
    valor?: number | undefined;
    ord?: number | undefined;
    forma_pagamento?: string | null | undefined;
    conta?: string | null | undefined;
    numero_op?: string | null | undefined;
}>;
export type ParcelaDto = z.infer<typeof ParcelaSchema>;
export declare const LiquidacaoSchema: z.ZodObject<{
    valor: z.ZodDefault<z.ZodNumber>;
    data_liquidacao: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    data_pagamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    numero_op: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    forma_pagamento: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    conta: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parcelas: z.ZodDefault<z.ZodArray<z.ZodObject<{
        valor: z.ZodDefault<z.ZodNumber>;
        data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        forma_pagamento: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        conta: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        numero_op: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        ord: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        valor: number;
        ord: number;
        data?: string | null | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
    }, {
        data?: string | null | undefined;
        valor?: number | undefined;
        ord?: number | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    valor: number;
    parcelas: {
        valor: number;
        ord: number;
        data?: string | null | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
    }[];
    forma_pagamento?: string | null | undefined;
    conta?: string | null | undefined;
    numero_op?: string | null | undefined;
    data_liquidacao?: string | null | undefined;
    data_pagamento?: string | null | undefined;
}, {
    valor?: number | undefined;
    forma_pagamento?: string | null | undefined;
    conta?: string | null | undefined;
    numero_op?: string | null | undefined;
    data_liquidacao?: string | null | undefined;
    data_pagamento?: string | null | undefined;
    parcelas?: {
        data?: string | null | undefined;
        valor?: number | undefined;
        ord?: number | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
    }[] | undefined;
}>;
export type LiquidacaoDto = z.infer<typeof LiquidacaoSchema>;
export declare const TipoEmpenhoEnum: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
export declare const ExercicioEnum: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>]>;
export declare const EmpenhoSchema: z.ZodObject<{
    numero_ficha: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projeto_atividade: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dotacao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    stn: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    subelemento_codigo: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | null | undefined, string | null | undefined>;
    subelemento_descricao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    credor_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    credor_numero: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    credor_nome: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tipo_empenho: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
    historico: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    valor_empenho: z.ZodDefault<z.ZodNumber>;
    emenda: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    exercicio: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>]>>;
    numero_contrato: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    numero_convenio: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    data_empenho: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    departamento_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    descontos: z.ZodDefault<z.ZodArray<z.ZodObject<{
        tipo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        codigo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        valor: z.ZodDefault<z.ZodNumber>;
        efd_codigo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        ord: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        valor: number;
        ord: number;
        codigo?: string | null | undefined;
        tipo?: string | null | undefined;
        efd_codigo?: string | null | undefined;
    }, {
        codigo?: string | null | undefined;
        tipo?: string | null | undefined;
        valor?: number | undefined;
        efd_codigo?: string | null | undefined;
        ord?: number | undefined;
    }>, "many">>;
    liquidacao: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        valor: z.ZodDefault<z.ZodNumber>;
        data_liquidacao: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        data_pagamento: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        numero_op: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        forma_pagamento: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        conta: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        parcelas: z.ZodDefault<z.ZodArray<z.ZodObject<{
            valor: z.ZodDefault<z.ZodNumber>;
            data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            forma_pagamento: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            conta: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            numero_op: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            ord: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            valor: number;
            ord: number;
            data?: string | null | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }, {
            data?: string | null | undefined;
            valor?: number | undefined;
            ord?: number | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        valor: number;
        parcelas: {
            valor: number;
            ord: number;
            data?: string | null | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }[];
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
        data_liquidacao?: string | null | undefined;
        data_pagamento?: string | null | undefined;
    }, {
        valor?: number | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
        data_liquidacao?: string | null | undefined;
        data_pagamento?: string | null | undefined;
        parcelas?: {
            data?: string | null | undefined;
            valor?: number | undefined;
            ord?: number | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    tipo_empenho: 1 | 2 | 3;
    valor_empenho: number;
    exercicio: 1 | 2;
    descontos: {
        valor: number;
        ord: number;
        codigo?: string | null | undefined;
        tipo?: string | null | undefined;
        efd_codigo?: string | null | undefined;
    }[];
    departamento_id?: number | null | undefined;
    numero_ficha?: string | null | undefined;
    projeto_atividade?: string | null | undefined;
    dotacao?: string | null | undefined;
    stn?: string | null | undefined;
    subelemento_codigo?: string | null | undefined;
    subelemento_descricao?: string | null | undefined;
    credor_id?: number | null | undefined;
    credor_numero?: string | null | undefined;
    credor_nome?: string | null | undefined;
    historico?: string | null | undefined;
    emenda?: number | null | undefined;
    numero_contrato?: string | null | undefined;
    numero_convenio?: string | null | undefined;
    data_empenho?: string | null | undefined;
    liquidacao?: {
        valor: number;
        parcelas: {
            valor: number;
            ord: number;
            data?: string | null | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }[];
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
        data_liquidacao?: string | null | undefined;
        data_pagamento?: string | null | undefined;
    } | null | undefined;
}, {
    departamento_id?: number | null | undefined;
    numero_ficha?: string | null | undefined;
    projeto_atividade?: string | null | undefined;
    dotacao?: string | null | undefined;
    stn?: string | null | undefined;
    subelemento_codigo?: string | null | undefined;
    subelemento_descricao?: string | null | undefined;
    credor_id?: number | null | undefined;
    credor_numero?: string | null | undefined;
    credor_nome?: string | null | undefined;
    tipo_empenho?: 1 | 2 | 3 | undefined;
    historico?: string | null | undefined;
    valor_empenho?: number | undefined;
    emenda?: number | null | undefined;
    exercicio?: 1 | 2 | undefined;
    numero_contrato?: string | null | undefined;
    numero_convenio?: string | null | undefined;
    data_empenho?: string | null | undefined;
    descontos?: {
        codigo?: string | null | undefined;
        tipo?: string | null | undefined;
        valor?: number | undefined;
        efd_codigo?: string | null | undefined;
        ord?: number | undefined;
    }[] | undefined;
    liquidacao?: {
        valor?: number | undefined;
        forma_pagamento?: string | null | undefined;
        conta?: string | null | undefined;
        numero_op?: string | null | undefined;
        data_liquidacao?: string | null | undefined;
        data_pagamento?: string | null | undefined;
        parcelas?: {
            data?: string | null | undefined;
            valor?: number | undefined;
            ord?: number | undefined;
            forma_pagamento?: string | null | undefined;
            conta?: string | null | undefined;
            numero_op?: string | null | undefined;
        }[] | undefined;
    } | null | undefined;
}>;
export type EmpenhoDto = z.infer<typeof EmpenhoSchema>;
export declare const QR_CAMPOS_DISPONIVEIS: readonly ["id", "numero_ficha", "projeto_atividade", "dotacao", "stn", "subelemento_codigo", "subelemento_descricao", "credor_id", "credor_numero", "credor_nome", "tipo_empenho", "historico", "valor_empenho", "emenda", "exercicio", "numero_contrato", "numero_convenio", "data_empenho", "usuario_id", "usuario_nome", "created_at", "updated_at", "data_liquidacao", "data_pagamento", "conta_liquidacao", "numero_op_liquidacao", "forma_pagamento_liquidacao"];
export type QrCampo = (typeof QR_CAMPOS_DISPONIVEIS)[number];
export declare const ConfigQrSchema: z.ZodObject<{
    campos: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodArray<z.ZodString, "many">, string, string[]>]>;
    separador: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    campos: string;
    separador: string;
}, {
    campos: string | string[];
    separador?: string | undefined;
}>;
export type ConfigQrDto = z.infer<typeof ConfigQrSchema>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
export declare const EmpenhoFiltrosSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
} & {
    q: z.ZodOptional<z.ZodString>;
    interno: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodNumber>;
    de: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    departamento_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    q?: string | undefined;
    de?: string | null | undefined;
    departamento_id?: number | undefined;
    tipo?: number | undefined;
    interno?: string | undefined;
    ate?: string | null | undefined;
}, {
    q?: string | undefined;
    de?: string | null | undefined;
    departamento_id?: number | undefined;
    tipo?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    interno?: string | undefined;
    ate?: string | null | undefined;
}>;
export type EmpenhoFiltrosDto = z.infer<typeof EmpenhoFiltrosSchema>;
