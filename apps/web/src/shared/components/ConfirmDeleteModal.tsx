import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  codigoInterno: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ConfirmDeleteModal({ open, codigoInterno, onConfirm, onCancel, isLoading }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isLoading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,22,34,0.4)', backdropFilter: 'blur(4px)', animation: 'fade-in 0.15s ease both' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden"
        style={{ animation: 'modal-in 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <div>
            <h2 id="modal-title" style={{ fontFamily: 'Manrope, system-ui, sans-serif', fontWeight: 700, fontSize: 16, color: '#0f1622', margin: '0 0 4px' }}>
              Excluir empenho
            </h2>
            <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 600, color: '#2a3344', margin: 0 }}>
              {codigoInterno}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-5">
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
            Esta ação removerá permanentemente o empenho selecionado, incluindo todos os descontos e dados de liquidação associados.
          </p>
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5, margin: 0 }}>
              Esta operação é irreversível e não pode ser desfeita.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid #f0f3f8', background: '#fafbfc' }}>
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
            style={{ background: isLoading ? '#f87171' : '#dc2626' }}
          >
            {isLoading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Excluindo…
              </>
            ) : (
              'Excluir empenho'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
