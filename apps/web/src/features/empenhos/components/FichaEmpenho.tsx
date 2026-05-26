import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { buildQrText, formatCurrencyBR } from '@ficha-empenho/shared';
import { supabase } from '@/shared/lib/supabaseClient';
import type { Empenho, ConfigQr, Desconto, Parcela } from '@ficha-empenho/shared';

type Props = {
  empenho: Empenho;
  onVoltar: () => void;
  onEditar: () => void;
};

const TIPO_LABEL: Record<number, string> = { 1: 'Ordinário', 2: 'Reexercício', 3: 'Global' };
const EXERCICIO_LABEL: Record<number, string> = { 1: 'Normal', 2: 'Superávit' };
const EMENDA_LABEL: Record<number, string> = {
  1: 'Individual',
  2: 'Parlamentar',
  3: 'Bancada',
  4: 'Comissão',
};

function dataBR(d: string | null | undefined): string {
  if (!d) return '';
  const match = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const dt = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-BR');
  }
  return d;
}

function v(x: string | number | null | undefined): string {
  return x != null && x !== '' ? String(x) : '—';
}
function vt(x: string | number | null | undefined): string {
  return x != null && x !== '' ? String(x) : '';
}

// ─── Design tokens (inline, print-safe) ───────────────────────────────────────

const C = {
  ink900: '#0f1622',
  ink700: '#2a3344',
  ink500: '#5b667a',
  ink400: '#8590a3',
  ink300: '#b4bccb',
  line:   '#e3e7ee',
  bg:     '#f6f8fb',
  blue:   '#3ea3ff',
  white:  '#ffffff',
};

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SANS = 'Manrope, system-ui, sans-serif';
const DISPLAY = 'Fraunces, Georgia, serif';

// ─── Campo individual da grade ────────────────────────────────────────────────

function Campo({
  label,
  valor,
  mono = false,
  style,
}: {
  label: string;
  valor: string;
  mono?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 4, paddingTop: 2, ...style }}>
      <div style={{
        fontFamily: MONO,
        fontSize: 7,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: C.ink400,
        marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: mono ? MONO : SANS,
        fontSize: mono ? 10 : 10.5,
        fontWeight: 600,
        color: C.ink900,
        lineHeight: 1.2,
        wordBreak: 'break-word',
      }}>
        {valor}
      </div>
    </div>
  );
}

// ─── Cabeçalho de seção ───────────────────────────────────────────────────────

function SecaoHeader({ titulo }: { titulo: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 8,
      paddingBottom: 5,
      borderBottom: `1.5px solid ${C.line}`,
    }}>
      <div style={{ width: 3, height: 13, background: C.ink900, borderRadius: 2, flexShrink: 0 }} />
      <span style={{
        fontFamily: MONO,
        fontSize: 8,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: C.ink500,
      }}>
        {titulo}
      </span>
    </div>
  );
}

// ─── Th de tabela ─────────────────────────────────────────────────────────────

function Th({ children, align = 'left', w }: { children: React.ReactNode; align?: string; w?: string }) {
  return (
    <th style={{
      padding: '4px 6px',
      background: C.bg,
      borderBottom: `1.5px solid ${C.line}`,
      borderRight: `1px solid ${C.line}`,
      fontFamily: MONO,
      fontSize: 7.5,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: C.ink500,
      textAlign: align as React.CSSProperties['textAlign'],
      width: w,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, align = 'left', style }: { children: React.ReactNode; align?: string; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '4px 6px',
      borderBottom: `1px solid ${C.line}`,
      borderRight: `1px solid ${C.line}`,
      fontFamily: MONO,
      fontSize: 9.5,
      color: C.ink700,
      textAlign: align as React.CSSProperties['textAlign'],
      ...style,
    }}>
      {children}
    </td>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FichaEmpenho({ empenho, onVoltar, onEditar }: Props) {
  const { data: configQr } = useQuery<ConfigQr>({
    queryKey: ['config-qr'],
    queryFn: async () => {
      const { data, error } = await supabase.from('config_qr').select('*').eq('id', 1).single();
      if (error) throw new Error(error.message);
      return data as ConfigQr;
    },
    staleTime: 60 * 60_000,
  });

  const descontos: Desconto[] = empenho.descontos ?? [];
  const liquidacao = empenho.liquidacao;
  const parcelas: Parcela[] = liquidacao?.parcelas ?? [];

  const hasEfd = descontos.some((d) => d.efd_codigo);
  const totalDesc = descontos.reduce((s, d) => s + (d.valor ?? 0), 0);
  const blankDescRows = Math.max(0, 3 - descontos.length);
  const nParc = Math.max(3, parcelas.length);

  const qrText =
    configQr && empenho
      ? buildQrText(
          {
            ...empenho,
            data_liquidacao: liquidacao?.data_liquidacao ?? undefined,
            data_pagamento: liquidacao?.data_pagamento ?? undefined,
            conta_liquidacao: liquidacao?.conta ?? undefined,
            numero_op_liquidacao: liquidacao?.numero_op ?? undefined,
            forma_pagamento_liquidacao: liquidacao?.forma_pagamento ?? undefined,
          },
          configQr,
        )
      : '';

  const impressoPor = empenho.usuario_nome ?? '';
  const dataImpressao = new Date().toLocaleDateString('pt-BR');

  return (
    <>
      {/* ── Barra de ações (não imprime) ──────────────────────────────────── */}
      <div className="print:hidden max-w-[210mm] mx-auto mb-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={onVoltar}
          className="text-sm text-ink-500 hover:text-ink-900 transition flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
        <button
          onClick={onEditar}
          className="text-sm text-accent-blue hover:underline"
        >
          Editar
        </button>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-xl bg-ink-900 text-white px-5 py-2 text-sm font-semibold hover:bg-ink-700 transition flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir / PDF
        </button>
      </div>

      {/* ── Folha A4 ─────────────────────────────────────────────────────── */}
      <div
        className="mx-auto bg-white"
        style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          boxShadow: '0 4px 32px rgba(15,22,34,.12)',
          fontFamily: SANS,
        }}
      >
        {/* Faixa institucional — 4 cores da gestão */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 6, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
          <div style={{ background: '#3ea3ff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties} />
          <div style={{ background: '#b86a2b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties} />
          <div style={{ background: '#ffb829', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties} />
          <div style={{ background: '#ea4242', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties} />
        </div>

        {/* Header — fundo branco */}
        <header style={{ background: C.white, padding: '8mm 14mm 7mm', borderBottom: `1.5px solid ${C.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontFamily: DISPLAY,
                fontSize: 16,
                fontWeight: 600,
                color: C.ink900,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}>
                Prefeitura Municipal de Parintins
              </div>
              <div style={{
                fontFamily: MONO,
                fontSize: 8,
                color: C.ink400,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginTop: 5,
              }}>
                Sistema de Fichas de Empenho
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: MONO,
                fontSize: 7,
                color: C.ink400,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Código do Empenho
              </div>
              <div style={{
                fontFamily: MONO,
                fontSize: 16,
                fontWeight: 700,
                color: C.ink900,
                letterSpacing: '0.04em',
                borderBottom: `1.5px solid ${C.line}`,
                paddingBottom: 3,
                minWidth: 120,
              }}>
                {empenho.codigo_interno}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div style={{ padding: '9mm 14mm 10mm' }}>

          {/* ── Classificação Orçamentária ──────────────────────────────────── */}
          <section style={{ marginBottom: 10 }}>
            <SecaoHeader titulo="Classificação Orçamentária" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '5px 10px' }}>

              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Nº Ficha" valor={v(empenho.numero_ficha)} mono />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Data do Empenho" valor={dataBR(empenho.data_empenho) || '—'} mono />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Tipo" valor={TIPO_LABEL[empenho.tipo_empenho] ?? '—'} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Exercício" valor={EXERCICIO_LABEL[empenho.exercicio] ?? '—'} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo
                  label="Emenda"
                  valor={empenho.emenda ? (EMENDA_LABEL[empenho.emenda] ?? String(empenho.emenda)) : '—'}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Código Interno" valor={v(empenho.codigo_interno)} mono />
              </div>

              <div style={{ gridColumn: 'span 5' }}>
                <Campo label="Dotação (Natureza da Despesa)" valor={v(empenho.dotacao)} mono />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <Campo label="Fonte (STN)" valor={v(empenho.stn)} mono />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <Campo
                  label="Sub-elemento"
                  valor={
                    empenho.subelemento_codigo
                      ? empenho.subelemento_codigo + (empenho.subelemento_descricao ? ' — ' + empenho.subelemento_descricao : '')
                      : v(empenho.subelemento_descricao)
                  }
                  mono
                />
              </div>

              <div style={{ gridColumn: 'span 8' }}>
                <Campo label="Projeto / Atividade" valor={v(empenho.projeto_atividade)} />
              </div>
              <div style={{ gridColumn: 'span 4' }}>
                <Campo
                  label="Valor do Empenho"
                  valor={`R$ ${formatCurrencyBR(empenho.valor_empenho)}`}
                  mono
                  style={{ borderBottom: `1.5px solid ${C.ink900}` }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <Campo label="Nº do Credor" valor={v(empenho.credor_numero)} mono />
              </div>
              <div style={{ gridColumn: 'span 10' }}>
                <Campo label="Nome do Credor" valor={v(empenho.credor_nome)} />
              </div>

              {(empenho.numero_contrato || empenho.numero_convenio) && (
                <>
                  <div style={{ gridColumn: 'span 4' }}>
                    <Campo label="Nº do Contrato" valor={v(empenho.numero_contrato)} mono />
                  </div>
                  <div style={{ gridColumn: 'span 4' }}>
                    <Campo label="Nº do Convênio" valor={v(empenho.numero_convenio)} mono />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ── Histórico ────────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 10 }}>
            <SecaoHeader titulo="Histórico / Objeto" />
            <div style={{
              fontFamily: SANS,
              fontSize: 10,
              color: C.ink700,
              lineHeight: 1.6,
              minHeight: 32,
              padding: '5px 7px',
              border: `1px solid ${C.line}`,
              borderRadius: 4,
              background: '#fafbfc',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {vt(empenho.historico) || <span style={{ color: C.ink300 }}>—</span>}
            </div>
          </section>

          {/* ── Descontos / Retenções ─────────────────────────────────────────── */}
          <section style={{ marginBottom: 10 }}>
            <SecaoHeader titulo="Descontos / Retenções" />
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: `1px solid ${C.line}` }}>
              <colgroup>
                <col style={{ width: hasEfd ? '16%' : '20%' }} />
                <col style={{ width: hasEfd ? '44%' : '55%' }} />
                <col style={{ width: hasEfd ? '20%' : '25%' }} />
                {hasEfd && <col style={{ width: '20%' }} />}
              </colgroup>
              <thead>
                <tr>
                  <Th>Cód. Retenção</Th>
                  <Th>Tipo / Descrição</Th>
                  <Th align="right">Valor (R$)</Th>
                  {hasEfd && <Th align="center">EFD</Th>}
                </tr>
              </thead>
              <tbody>
                {descontos.map((d) => (
                  <tr key={d.id}>
                    <Td>{vt(d.codigo)}</Td>
                    <Td>{vt(d.tipo)}</Td>
                    <Td align="right">{d.valor != null ? `R$ ${formatCurrencyBR(d.valor)}` : ''}</Td>
                    {hasEfd && <Td align="center" style={{ fontWeight: 600 }}>{vt(d.efd_codigo)}</Td>}
                  </tr>
                ))}
                {Array.from({ length: blankDescRows }).map((_, i) => (
                  <tr key={`blank-${i}`}>
                    <Td>&nbsp;</Td>
                    <Td>{''}</Td>
                    <Td>{''}</Td>
                    {hasEfd && <Td>{''}</Td>}
                  </tr>
                ))}
                <tr style={{ background: C.bg }}>
                  <td
                    colSpan={hasEfd ? 3 : 2}
                    style={{
                      padding: '4px 6px',
                      borderTop: `1.5px solid ${C.line}`,
                      borderRight: `1px solid ${C.line}`,
                      fontFamily: MONO,
                      fontSize: 8,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: C.ink500,
                    }}
                  >
                    Total Descontos
                  </td>
                  <td style={{
                    padding: '4px 6px',
                    borderTop: `1.5px solid ${C.line}`,
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.ink900,
                    textAlign: 'right',
                  }}>
                    R$ {formatCurrencyBR(totalDesc)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ── Liquidação ───────────────────────────────────────────────────── */}
          <section style={{ marginBottom: 10 }}>
            <SecaoHeader titulo="Liquidação" />

            {/* Resumo da liquidação */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '5px 10px',
              marginBottom: 8,
              padding: '6px 8px',
              background: C.bg,
              borderRadius: 4,
              border: `1px solid ${C.line}`,
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Campo
                  label="Valor Líquido"
                  valor={liquidacao?.valor != null ? `R$ ${formatCurrencyBR(liquidacao.valor)}` : '—'}
                  mono
                  style={{ borderBottom: `1.5px solid ${C.ink900}`, borderColor: C.ink900 }}
                />
              </div>
              <div>
                <Campo label="Data Liquidação" valor={dataBR(liquidacao?.data_liquidacao) || '—'} mono />
              </div>
              <div>
                <Campo label="Data Pagamento" valor={dataBR(liquidacao?.data_pagamento) || '—'} mono />
              </div>
              <div>
                <Campo label="Forma de Pagamento" valor={vt(liquidacao?.forma_pagamento) || '—'} />
              </div>
              <div>
                <Campo label="Nº O.P." valor={vt(liquidacao?.numero_op) || '—'} mono />
              </div>
              <div style={{ gridColumn: 'span 6' }}>
                <Campo label="Conta Bancária" valor={vt(liquidacao?.conta) || '—'} mono />
              </div>
            </div>

            {/* Parcelas */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.line}` }}>
              <thead>
                <tr>
                  <Th align="right" w="20%">Valor (R$)</Th>
                  <Th w="18%">Data</Th>
                  <Th w="20%">Forma Pag.</Th>
                  <Th>Conta</Th>
                  <Th w="16%">Nº O.P.</Th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: nParc }).map((_, i) => {
                  const p = parcelas[i];
                  return (
                    <tr key={i} style={{ background: i % 2 === 1 ? '#fafbfc' : C.white }}>
                      <Td align="right">{p?.valor != null ? `R$ ${formatCurrencyBR(p.valor)}` : ''}</Td>
                      <Td>{dataBR(p?.data)}</Td>
                      <Td>{vt(p?.forma_pagamento)}</Td>
                      <Td>{vt(p?.conta)}</Td>
                      <Td>{vt(p?.numero_op)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* ── Rodapé ──────────────────────────────────────────────────────── */}
          <footer style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: `1.5px solid ${C.line}`,
            pageBreakInside: 'avoid',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

              {/* QR Code */}
              {qrText && (
                <div style={{ flexShrink: 0 }}>
                  <QRCodeSVG value={qrText} size={72} level="M" />
                </div>
              )}

              <div style={{ flex: 1 }}>
                {/* Metadados */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}>
                  {[
                    ['Emitido por', impressoPor || '—'],
                    ['Data de Impressão', dataImpressao],
                    ['Código Interno', empenho.codigo_interno],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontFamily: MONO, fontSize: 6.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.ink400, marginBottom: 1 }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: C.ink700 }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Etapas de aprovação */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    'Conferência',
                    'Conciliação',
                    'Empenhar / 2ª Conf.',
                    'Liquidação',
                    'Baixa Pagto.',
                    'Dig. Item',
                  ].map((etapa) => (
                    <div key={etapa} style={{
                      border: `1px solid ${C.line}`,
                      borderRadius: 3,
                      padding: '3px 7px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      minWidth: 70,
                    }}>
                      <div style={{
                        fontFamily: MONO,
                        fontSize: 6.5,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: C.ink400,
                        textAlign: 'center',
                      }}>
                        {etapa}
                      </div>
                      <div style={{ height: 18, width: '100%', borderTop: `1px solid ${C.line}` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
