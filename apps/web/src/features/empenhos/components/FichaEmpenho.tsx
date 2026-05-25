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
  return x != null && x !== '' ? String(x) : '_____________';
}

function vt(x: string | number | null | undefined): string {
  return x != null && x !== '' ? String(x) : '';
}

function CampoClassif({
  label,
  valor,
  span,
}: {
  label: string;
  valor: string;
  span?: string;
}) {
  return (
    <div
      className={`border-b border-black px-1 pb-0.5 ${span ?? ''}`}
      style={{ lineHeight: 1.1 }}
    >
      <span className="block text-[9px] font-semibold uppercase text-gray-600">{label}</span>
      <b className="text-[11px] font-semibold break-words">{valor}</b>
    </div>
  );
}

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

  // Blank rows to always show at least 3 discount rows
  const blankDescRows = Math.max(0, 3 - descontos.length);
  // Parcelas: always at least 3 rows
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
      {/* ── Botões (não imprimem) ─────────────────────────────────────────── */}
      <div className="print:hidden max-w-[210mm] mx-auto mb-4 flex gap-3 flex-wrap">
        <button
          onClick={onVoltar}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Voltar para lista
        </button>
        <button
          onClick={onEditar}
          className="text-sm text-brand-600 hover:underline"
        >
          Editar
        </button>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-brand-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-brand-700 transition"
        >
          Imprimir
        </button>
      </div>

      {/* ── Folha A4 ─────────────────────────────────────────────────────── */}
      <div
        className="mx-auto bg-white"
        style={{
          maxWidth: '210mm',
          minHeight: '277mm',
          padding: '12mm',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <header
          className="flex justify-between items-start mb-4 pb-3"
          style={{ borderBottom: '2px solid #0d47a1' }}
        >
          <div>
            <h1 className="m-0 text-[1.1rem] font-bold" style={{ color: '#0d47a1' }}>
              Prefeitura Municipal de Parintins
            </h1>
            <p className="mt-1 text-[0.85rem] text-gray-500 m-0">Sistema de Fichas de Empenho</p>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap mt-1">
            <label className="text-[13px] font-bold">Nº DO EMPENHO</label>
            <div style={{ width: 160, height: 16, borderBottom: '1.5px solid #000' }} />
          </div>
        </header>

        {/* Classificação Orçamentária */}
        <section className="mb-3">
          <h3 className="m-0 mb-1.5 text-[0.9rem] font-semibold" style={{ color: '#0d47a1' }}>
            Classificação Orçamentária
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '4px 10px',
            }}
          >
            <CampoClassif label="Nº Ficha" valor={v(empenho.numero_ficha)} span="col-span-2" />
            <CampoClassif label="Data Emp." valor={dataBR(empenho.data_empenho)} span="col-span-2" />
            <CampoClassif label="Dotação" valor={v(empenho.dotacao)} span="col-span-4" />
            <CampoClassif label="STN" valor={v(empenho.stn)} span="col-span-2" />
            <CampoClassif
              label="Emenda"
              valor={empenho.emenda ? (EMENDA_LABEL[empenho.emenda] ?? String(empenho.emenda)) : '—'}
              span="col-span-2"
            />
            <CampoClassif
              label="Exercício"
              valor={EXERCICIO_LABEL[empenho.exercicio] ?? '—'}
              span="col-span-2"
            />
            <CampoClassif
              label="Projeto/Atividade"
              valor={v(empenho.projeto_atividade)}
              span="col-span-6"
            />
            <CampoClassif
              label="Sub-elemento"
              valor={
                empenho.subelemento_codigo
                  ? empenho.subelemento_codigo +
                    (empenho.subelemento_descricao ? ' - ' + empenho.subelemento_descricao : '')
                  : v(empenho.subelemento_descricao)
              }
              span="col-span-4"
            />
            <CampoClassif label="Nº Credor" valor={v(empenho.credor_numero)} span="col-span-2" />
            <CampoClassif label="Credor" valor={v(empenho.credor_nome)} span="col-span-6" />
            <CampoClassif
              label="Tipo Emp."
              valor={TIPO_LABEL[empenho.tipo_empenho] ?? '—'}
              span="col-span-3"
            />
            <CampoClassif
              label="Valor Empenho"
              valor={`R$ ${formatCurrencyBR(empenho.valor_empenho)}`}
              span="col-span-4"
            />
          </div>
        </section>

        {/* Histórico */}
        <section className="mb-3">
          <h3 className="m-0 mb-1.5 text-[0.9rem] font-semibold" style={{ color: '#0d47a1' }}>
            Histórico do Empenho
          </h3>
          <div
            className="text-[0.85rem] whitespace-pre-wrap break-words"
            style={{
              border: '1px solid #eee',
              padding: '0.5rem',
              minHeight: '2rem',
            }}
          >
            {v(empenho.historico)}
          </div>
        </section>

        {/* Descontos */}
        <section className="mb-3">
          <h3 className="m-0 mb-1.5 text-[0.9rem] font-semibold" style={{ color: '#0d47a1' }}>
            Descontos
          </h3>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    background: '#e3f2fd',
                    width: hasEfd ? '15%' : '20%',
                    textAlign: 'left',
                  }}
                >
                  Nº do Código
                </th>
                <th
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    background: '#e3f2fd',
                    width: hasEfd ? '45%' : '55%',
                    textAlign: 'left',
                  }}
                >
                  Tipo
                </th>
                <th
                  style={{
                    padding: '4px 6px',
                    border: '1px solid #ddd',
                    background: '#e3f2fd',
                    width: hasEfd ? '20%' : '25%',
                    textAlign: 'right',
                  }}
                >
                  Valor (R$)
                </th>
                {hasEfd && (
                  <th
                    style={{
                      padding: '4px 6px',
                      border: '1px solid #ddd',
                      background: '#e3f2fd',
                      width: '20%',
                      textAlign: 'center',
                    }}
                  >
                    EFD
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {descontos.map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>{vt(d.codigo)}</td>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>{vt(d.tipo)}</td>
                  <td
                    style={{
                      padding: '3px 5px',
                      border: '1px solid #ddd',
                      textAlign: 'right',
                    }}
                  >
                    {d.valor != null ? `R$ ${formatCurrencyBR(d.valor)}` : ''}
                  </td>
                  {hasEfd && (
                    <td
                      style={{
                        padding: '3px 5px',
                        border: '1px solid #ddd',
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                    >
                      {vt(d.efd_codigo)}
                    </td>
                  )}
                </tr>
              ))}
              {Array.from({ length: blankDescRows }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }} />
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }} />
                  {hasEfd && <td style={{ padding: '3px 5px', border: '1px solid #ddd' }} />}
                </tr>
              ))}
              <tr style={{ background: '#f5f5f5' }}>
                <td
                  colSpan={hasEfd ? 3 : 2}
                  style={{ padding: '3px 5px', border: '1px solid #ddd', fontWeight: 600 }}
                >
                  Total Descontos
                </td>
                <td
                  style={{
                    padding: '3px 5px',
                    border: '1px solid #ddd',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  R$ {formatCurrencyBR(totalDesc)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Liquidação */}
        <section className="mb-3">
          <h3 className="m-0 mb-1.5 text-[0.9rem] font-semibold" style={{ color: '#0d47a1' }}>
            Liquidação
          </h3>
          <div
            style={{
              padding: '0.5rem',
              background: '#fafafa',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem 0.75rem',
                marginBottom: '0.35rem',
              }}
            >
              {(
                [
                  ['Valor Líquido', liquidacao?.valor != null ? `R$ ${formatCurrencyBR(liquidacao.valor)}` : ''],
                  ['Data Liquidação', dataBR(liquidacao?.data_liquidacao)],
                  ['Data Pagamento', dataBR(liquidacao?.data_pagamento)],
                  ['Conta', vt(liquidacao?.conta)],
                  ['Forma Pagamento', vt(liquidacao?.forma_pagamento)],
                  ['Nº OP', vt(liquidacao?.numero_op)],
                ] as [string, string][]
              ).map(([label, val]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[0.7rem] text-gray-500">{label}</span>
                  <span className="text-[0.85rem]">{val}</span>
                </div>
              ))}
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.75rem',
              }}
            >
              <thead>
                <tr>
                  {['Valor', 'Data', 'Forma Pag.', 'Conta', 'Nº OP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '3px 5px',
                        border: '1px solid #ddd',
                        background: '#e3f2fd',
                        textAlign: 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: nParc }).map((_, i) => {
                  const p = parcelas[i];
                  return (
                    <tr key={i}>
                      <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                        {p?.valor != null ? `R$ ${formatCurrencyBR(p.valor)}` : ''}
                      </td>
                      <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                        {dataBR(p?.data)}
                      </td>
                      <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                        {vt(p?.forma_pagamento)}
                      </td>
                      <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                        {vt(p?.conta)}
                      </td>
                      <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                        {vt(p?.numero_op)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #ddd',
            fontSize: '0.7rem',
            lineHeight: 1.4,
            pageBreakInside: 'avoid',
          }}
        >
          {qrText && (
            <div style={{ float: 'left', marginRight: 12 }}>
              <QRCodeSVG value={qrText} size={80} />
            </div>
          )}
          <div style={{ marginBottom: 2, whiteSpace: 'nowrap' }}>
            1. Impresso por: <strong>{impressoPor}</strong>&nbsp;&nbsp;Data:{' '}
            <strong>{dataImpressao}</strong>&nbsp;&nbsp;Nº interno:{' '}
            <strong>{empenho.codigo_interno}</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              '2. Conferência',
              '3. Conciliação',
              '4. Empenhar & 2º Conf.',
              '5. Liquidação',
              '6. Baixa Pagto',
              '7. Dig. Item',
            ].map((etapa) => (
              <span key={etapa}>{etapa}</span>
            ))}
          </div>
          <div style={{ clear: 'both' }} />
        </footer>
      </div>
    </>
  );
}
