import { useState, type ReactNode } from 'react';
import { useAuthStore } from '@/shared/lib/authStore';
import { EmpenhosPage } from '@/features/empenhos/components/EmpenhosPage';
import { ConfigPage } from '@/features/config/ConfigPage';
import { ImportPage } from '@/features/import/ImportPage';
import { AuditPage } from '@/features/audit/AuditPage';

type Route = 'inicio' | 'empenhos' | 'novo-empenho' | 'config' | 'import' | 'audit';

const C = {
  ink900: '#0f1622',
  ink700: '#2a3344',
  ink500: '#5b667a',
  ink400: '#8590a3',
  line: '#e3e7ee',
  line2: '#eef1f6',
  bgSoft: '#f6f8fb',
  bgSoft2: '#f0f3f8',
  blue: '#3ea3ff',
  red: '#ea4242',
} as const;

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 12px', borderRadius: 8, width: '100%',
        fontFamily: 'Manrope, system-ui, sans-serif',
        fontSize: 13.5, fontWeight: 500, textAlign: 'left',
        border: 0, cursor: 'pointer',
        background: active ? C.ink900 : 'transparent',
        color: active ? '#fff' : C.ink700,
        transition: 'background .15s, color .15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.ink900; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink700; } }}
    >
      <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ route, setRoute, isAdmin }: { route: Route; setRoute: (r: Route) => void; isAdmin: boolean }) {
  const { user, logout } = useAuthStore();

  const initials = user?.nome
    ? user.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="no-print" style={{
      background: '#fff',
      borderRight: `1px solid ${C.line}`,
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      width: 256,
    }}>
      {/* Brand */}
      <div style={{
        padding: '22px 22px 18px',
        borderBottom: `1px solid ${C.line2}`,
        display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden',
      }}>
        <img src="/logo.png" alt="PMP" style={{ height: 28, width: 'auto', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink500 }}>
            SEFIN
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: C.ink900, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Fichas de Empenho
          </div>
        </div>
      </div>

      {/* Nav: Principal */}
      <div style={{ padding: '18px 16px 6px' }}>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink400, padding: '0 8px 8px' }}>
          Principal
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        <NavItem icon={<IconHome />} label="Início" active={route === 'inicio'} onClick={() => setRoute('inicio')} />
        <NavItem icon={<IconDoc />} label="Empenhos" active={route === 'empenhos' || route === 'novo-empenho'} onClick={() => setRoute('empenhos')} />
      </nav>

      {/* Nav: Administração (admin only) */}
      {isAdmin && (
        <>
          <div style={{ padding: '18px 16px 6px' }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink400, padding: '0 8px 8px' }}>
              Administração
            </div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
            <NavItem icon={<IconUpload />} label="Importar" active={route === 'import'} onClick={() => setRoute('import')} />
            <NavItem icon={<IconSettings />} label="Configurações" active={route === 'config'} onClick={() => setRoute('config')} />
            <NavItem icon={<IconActivity />} label="Auditoria" active={route === 'audit'} onClick={() => setRoute('audit')} />
          </nav>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User */}
      <div style={{
        borderTop: `1px solid ${C.line2}`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: C.ink900, color: '#fff',
          display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 12, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.nome ?? 'Usuário'}
          </div>
          <div style={{ fontSize: 10.5, color: C.ink500, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.04em' }}>
            {user?.role ?? 'operador'}
          </div>
        </div>
        <button
          onClick={() => logout()}
          title="Sair"
          style={{
            width: 30, height: 30, borderRadius: 8,
            display: 'grid', placeItems: 'center',
            color: C.ink500, background: 'transparent', border: 0, cursor: 'pointer',
            transition: 'background .2s, color .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.red; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink500; }}
        >
          <IconLogout />
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

const routeLabels: Record<Route, string> = {
  inicio: 'Início',
  empenhos: 'Empenhos',
  'novo-empenho': 'Empenhos',
  config: 'Configurações',
  import: 'Importar',
  audit: 'Auditoria',
};

function Topbar({ route, onNovo }: { route: Route; onNovo: () => void }) {
  const showNovo = route === 'empenhos' || route === 'inicio';

  return (
    <header style={{
      background: '#fff',
      borderBottom: `1px solid ${C.line}`,
      padding: '14px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink500 }}>
          SEFIN
        </span>
        <span style={{ color: C.ink400 }}>/</span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink900, fontWeight: 600 }}>
          {routeLabels[route]}
        </span>
      </div>

      {showNovo && (
        <button
          onClick={onNovo}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: C.ink900, color: '#fff',
            borderRadius: 10, fontWeight: 600, fontSize: 13.5,
            letterSpacing: '-0.005em', border: 0, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,22,34,.04)',
            fontFamily: 'Manrope, system-ui, sans-serif',
            transition: 'background .2s, transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.ink700; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.ink900; e.currentTarget.style.transform = ''; }}
        >
          <IconPlus />
          Novo Empenho
        </button>
      )}
    </header>
  );
}

// ── Início page ───────────────────────────────────────────────────────────────

function InicioPage({ onNovo }: { onNovo: () => void }) {
  const { user } = useAuthStore();
  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário';
  const dept = user?.departamento?.nome ?? 'Departamento Geral';

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink500, marginBottom: 12 }}>
          Prefeitura Municipal de Parintins
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 36, letterSpacing: '-0.025em', margin: '0 0 8px', lineHeight: 1.05, color: C.ink900 }}>
          Olá, {firstName}.
        </h1>
        <p style={{ color: C.ink500, fontSize: 14.5, margin: 0 }}>
          {dept} · Fichas de Empenho 2026
        </p>
      </div>

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
        {[
          {
            color: '#3ea3ff',
            bg: '#eaf4ff',
            label: 'Novo Empenho',
            desc: 'Registrar uma nova ficha de empenho',
            action: onNovo,
          },
        ].map(card => (
          <button
            key={card.label}
            onClick={card.action}
            style={{
              background: '#fff', border: `1px solid ${C.line}`,
              borderRadius: 14, padding: '22px 22px 20px',
              textAlign: 'left', cursor: 'pointer',
              transition: 'box-shadow .2s, transform .15s',
              fontFamily: 'Manrope, system-ui, sans-serif',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px -8px rgba(15,22,34,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: card.color }} />
            <div style={{ width: 36, height: 36, borderRadius: 8, background: card.bg, display: 'grid', placeItems: 'center', marginBottom: 14, color: card.color }}>
              <IconPlus />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.ink900, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 13, color: C.ink500 }}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function MainLayout() {
  const { user } = useAuthStore();
  const [route, setRoute] = useState<Route>('inicio');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleNovo = () => setRoute('novo-empenho');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', minHeight: '100vh' }}>
      <Sidebar route={route} setRoute={setRoute} isAdmin={isAdmin} />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: C.bgSoft }}>
        <Topbar route={route} onNovo={handleNovo} />

        <main style={{ padding: '28px 32px 56px', flex: 1 }}>
          {route === 'inicio' && <InicioPage onNovo={handleNovo} />}
          {(route === 'empenhos' || route === 'novo-empenho') && <EmpenhosPage />}
          {route === 'config' && isAdmin && <ConfigPage />}
          {route === 'import' && isAdmin && <ImportPage />}
          {route === 'audit' && isAdmin && <AuditPage />}
        </main>
      </div>
    </div>
  );
}
