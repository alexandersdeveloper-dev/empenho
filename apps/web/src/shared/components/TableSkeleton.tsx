// ─── Tipos ────────────────────────────────────────────────────────────────────

type SkeletonCol = {
  /** Tailwind width class para a barra interna. Default: 'w-3/4' */
  width?: string;
  /** Esconde a célula em breakpoints menores, mapeado para col-hide-* do globals.css */
  hidden?: 'sm' | 'mobile';
};

// Larguras variadas por linha — evita aspecto de grade perfeita e parece mais natural
const NATURAL_WIDTHS = ['w-3/4', 'w-2/3', 'w-4/5', 'w-1/2', 'w-3/5', 'w-3/4', 'w-2/3'];

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Substitui linhas de tabela durante carregamento, eliminando layout shift.
 * Deve ser renderizado dentro de um `<tbody>` já presente no DOM.
 *
 * @example
 * <tbody>
 *   {isLoading
 *     ? <TableSkeleton rows={8} cols={[
 *         { width: 'w-16' },
 *         { width: 'w-3/4' },
 *         { hidden: 'mobile' },
 *       ]} />
 *     : rows
 *   }
 * </tbody>
 */
export function TableSkeleton({ rows = 7, cols }: { rows?: number; cols: SkeletonCol[] }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} style={{ borderBottom: '1px solid #eef1f6' }}>
          {cols.map((col, ci) => (
            <td
              key={ci}
              className={`px-4 py-3.5${col.hidden === 'sm' ? ' col-hide-sm' : col.hidden === 'mobile' ? ' col-hide-mobile' : ''}`}
            >
              <div
                className={`h-3 rounded-md animate-pulse ${col.width ?? NATURAL_WIDTHS[(ri + ci) % NATURAL_WIDTHS.length]}`}
                style={{ background: '#e8ecf1' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
