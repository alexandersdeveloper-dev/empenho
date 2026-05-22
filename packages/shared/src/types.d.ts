import type { Role } from './schemas.js';
export type ApiMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
export type ApiResponse<T> = {
    data: T;
    meta?: ApiMeta;
    error?: never;
};
export type ApiError = {
    data?: never;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};
export type Departamento = {
    id: number;
    nome: string;
    sigla: string | null;
    ativo: boolean;
    created_at: string;
};
export type Perfil = {
    id: string;
    nome: string;
    email: string;
    role: Role;
    departamento_id: number | null;
    departamento?: Pick<Departamento, 'id' | 'nome' | 'sigla'>;
    ativo: boolean;
    created_at: string;
    updated_at: string;
};
export type Credor = {
    id: number;
    numero: string | null;
    nome: string;
    created_at: string;
};
export type Classificacao = {
    id: number;
    numero_ficha: string;
    projeto_atividade: string | null;
    dotacao: string | null;
    stn: string | null;
    created_at: string;
};
export type Subelemento = {
    id: number;
    natureza: string;
    sub: string;
    descricao: string | null;
    created_at: string;
};
export type Retencao = {
    id: number;
    nome: string;
    codigo: string;
    created_at: string;
};
export type FormaPagamento = {
    id: number;
    codigo: string;
    descricao: string | null;
    created_at: string;
};
export type EfdCodigo = {
    id: number;
    codigo: string;
    descricao: string | null;
    created_at: string;
};
export type Desconto = {
    id: number;
    empenho_id: number;
    tipo: string | null;
    codigo: string | null;
    valor: number;
    efd_codigo: string | null;
    ord: number;
};
export type Parcela = {
    id: number;
    liquidacao_id: number;
    valor: number;
    data: string | null;
    forma_pagamento: string | null;
    conta: string | null;
    numero_op: string | null;
    ord: number;
};
export type Liquidacao = {
    id: number;
    empenho_id: number;
    valor: number;
    data_liquidacao: string | null;
    data_pagamento: string | null;
    numero_op: string | null;
    forma_pagamento: string | null;
    conta: string | null;
    ord: number;
    parcelas?: Parcela[];
};
export type Empenho = {
    id: number;
    codigo_interno: string;
    departamento_id: number | null;
    departamento?: Pick<Departamento, 'id' | 'nome' | 'sigla'>;
    numero_ficha: string | null;
    projeto_atividade: string | null;
    dotacao: string | null;
    stn: string | null;
    subelemento_codigo: string | null;
    subelemento_descricao: string | null;
    credor_id: number | null;
    credor_numero: string | null;
    credor_nome: string | null;
    tipo_empenho: 1 | 2 | 3;
    historico: string | null;
    valor_empenho: number;
    emenda: number | null;
    exercicio: 1 | 2;
    numero_contrato: string | null;
    numero_convenio: string | null;
    data_empenho: string | null;
    usuario_id: string | null;
    usuario_nome: string | null;
    created_at: string;
    updated_at: string;
    descontos?: Desconto[];
    liquidacao?: Liquidacao;
};
export type ConfigQr = {
    id: number;
    campos: string;
    separador: string;
    updated_at: string;
};
export type AuditLog = {
    id: number;
    tabela: string;
    operacao: 'INSERT' | 'UPDATE' | 'DELETE';
    registro_id: string;
    dados_antes: Record<string, unknown> | null;
    dados_depois: Record<string, unknown> | null;
    usuario_id: string | null;
    ip: string | null;
    created_at: string;
};
export type ImportJobStatus = {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: {
        inserted: number;
        updated: number;
        errors: number;
    };
    error?: string;
};
