import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── Variantes ────────────────────────────────────────────────────────────────

export type ConfirmVariant = 'danger' | 'warning' | 'info';

const VARIANT_CFG: Record<ConfirmVariant, {
  iconBg: string;
  iconStroke: string;
  btnBg: string;
  btnBgLoading: string;
}> = {
  danger: {
    iconBg:       '#fef5f5',
    iconStroke:   '#dc2626',
    btnBg:        '#dc2626',
    btnBgLoading: '#f87171',
  },
  warning: {
    iconBg:       '#fff5dd',
    iconStroke:   '#b86a2b',   // institutional orange
    btnBg:        '#b86a2b',
    btnBgLoading: '#d4844a',
  },
  info: {
    iconBg:       '#eaf4ff',
    iconStroke:   '#1a5fa8',   // institutional blue
    btnBg:        '#1a5fa8',
    btnBgLoading: '#4a85c4',
  },
};

// ─── Ícones inline (sem dependência de icon-lib) ──────────────────────────────

function IconX({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}

function IconAlert({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconInfo({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  variant = 'warning',
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  // Fechar com Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isLoading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const cfg = VARIANT_CFG[variant];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,22,34,0.4)', backdropFilter: 'blur(4px)', animation: 'fade-in 0.15s ease both' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden"
        style={{ animation: 'modal-in 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-6 pb-5 flex items-start gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: cfg.iconBg }}
          >
            {variant === 'danger'  && <IconX     stroke={cfg.iconStroke} />}
            {variant === 'warning' && <IconAlert stroke={cfg.iconStroke} />}
            {variant === 'info'    && <IconInfo  stroke={cfg.iconStroke} />}
          </div>
          <div>
            <h2
              id="confirm-action-title"
              style={{ fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f1622', margin: '0 0 8px' }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              {description}
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3"
          style={{ borderTop: '1px solid #f0f3f8', background: '#fafbfc' }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-700 hover:bg-white hover:border-ink-400 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-60 flex items-center gap-2"
            style={{ background: isLoading ? cfg.btnBgLoading : cfg.btnBg }}
          >
            {isLoading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Aguarde…
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
