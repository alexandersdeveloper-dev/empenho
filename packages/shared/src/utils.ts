/**
 * Normalizes a budget nature code to 4-part format: 3.1.90.04
 * Ported from routes/empenho.js and routes/api.js in the legacy system.
 */
export function normalizarNatureza(s: string | null | undefined): string {
  if (!s || typeof s !== 'string') return '';
  const parts = String(s).trim().split('.').filter(Boolean);
  if (parts.length < 4) return String(s).trim();
  return (
    parts[0] +
    '.' +
    parts[1] +
    '.' +
    String(parts[2]).padStart(2, '0') +
    '.' +
    String(parts[3]).padStart(2, '0')
  );
}

/**
 * Pads a sub-element code to 2 digits: '1' → '01', '12' → '12'
 */
export function padSubelemento(sub: string | null | undefined): string {
  if (!sub) return '';
  return String(sub).trim().padStart(2, '0');
}

export type QrConfigFields = {
  campos: string;
  separador: string;
};

export type EmpenhoQrData = {
  id?: number | string;
  numero_ficha?: string;
  projeto_atividade?: string;
  dotacao?: string;
  stn?: string;
  subelemento_codigo?: string;
  subelemento_descricao?: string;
  credor_id?: number | string;
  credor_numero?: string;
  credor_nome?: string;
  tipo_empenho?: number | string;
  historico?: string;
  valor_empenho?: number | string;
  emenda?: number | string;
  exercicio?: number | string;
  numero_contrato?: string;
  numero_convenio?: string;
  data_empenho?: string;
  usuario_id?: string;
  usuario_nome?: string;
  created_at?: string;
  updated_at?: string;
  data_liquidacao?: string;
  data_pagamento?: string;
  conta_liquidacao?: string;
  numero_op_liquidacao?: string;
  forma_pagamento_liquidacao?: string;
};

/**
 * Assembles QR code text from configured fields.
 * Ported from routes/empenho.js buildQrText() in the legacy system.
 */
export function buildQrText(empenho: EmpenhoQrData, configQr: QrConfigFields): string {
  const sep = (configQr.separador || ';').replace('\\t', '\t');
  const campos = (configQr.campos || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const parts = campos.map((campo) => {
    const v = empenho[campo as keyof EmpenhoQrData];
    return v !== null && v !== undefined && v !== '' ? String(v) : '';
  });

  return parts.join(sep);
}

/**
 * Generates the internal voucher code from an ID.
 * E000001, E000123, etc.
 */
export function gerarCodigoInterno(id: number): string {
  return 'E' + String(id).padStart(6, '0');
}

/**
 * Parses a pt-BR currency string to a float number.
 * '1.234,56' → 1234.56
 */
export function parseCurrencyBR(value: string | null | undefined): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number to pt-BR currency string.
 * 1234.56 → '1.234,56'
 */
export function formatCurrencyBR(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
