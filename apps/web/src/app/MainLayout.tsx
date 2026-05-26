import { useState, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/shared/lib/authStore';
import { EmpenhosPage } from '@/features/empenhos/components/EmpenhosPage';
import { ConfigPage } from '@/features/config/ConfigPage';
import { ImportPage } from '@/features/import/ImportPage';
import { AuditPage } from '@/features/audit/AuditPage';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

type Route = 'inicio' | 'empenhos' | 'novo-empenho' | 'config' | 'import' | 'audit';

const C = {
  ink900: '#0f1622',
  ink700: '#2a3344',
  ink500: '#5b667a',
  ink400: '#8590a3',
  line: '#e3e7ee',
  line2: '#eef1f6',
  bgSoft: '#f6f8fb',
  red: '#ea4242',
} as const;

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className="nav-item"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
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
      <span className="sidebar-label">{label}</span>
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  route, setRoute, isAdmin, isOpen, onClose, isCollapsed, onToggle,
}: {
  route: Route; setRoute: (r: Route) => void;
  isAdmin: boolean; isOpen: boolean; onClose: () => void;
  isCollapsed: boolean; onToggle: () => void;
}) {
  const { user, logout } = useAuthStore();
  const initials = user?.nome
    ? user.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function navigate(r: Route) {
    setRoute(r);
    onClose();
  }

  return (
    <aside
      className={`app-sidebar no-print${isOpen ? ' is-open' : ''}`}
      style={{
        background: '#fff',
        borderRight: `1px solid ${C.line}`,
        display: 'flex', flexDirection: 'column',
        width: 256, height: '100vh',
        position: 'sticky', top: 0,
      }}
    >
      {/* Brand */}
      <div
        className="sidebar-brand"
        style={{
          padding: '18px 18px 14px',
          borderBottom: `1px solid ${C.line2}`,
          display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: C.ink900,
          display: 'grid', placeItems: 'center',
          fontFamily: '"IBM Plex Mono", monospace',
          fontWeight: 700, fontSize: 9.5, letterSpacing: '0.04em', color: '#fff',
        }}>
          PM
        </div>
        <div className="sidebar-brand-text" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink500 }}>
            SEFIN
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: C.ink900, letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Fichas de Empenho
          </div>
        </div>
        {/* Collapse — desktop only, só aparece quando expandido */}
        {!isCollapsed && (
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            title="Recolher menu"
            aria-label="Recolher menu"
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              color: C.ink400, background: 'transparent', border: 0, cursor: 'pointer',
              transition: 'background .15s, color .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bgSoft; e.currentTarget.style.color = C.ink900; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink400; }}
          >
            <IconChevronLeft />
          </button>
        )}

        {/* Close — mobile only via .hamburger class */}
        <button
          className="hamburger"
          onClick={onClose}
          title="Fechar menu"
          aria-label="Fechar menu"
          style={{
            width: 28, height: 28, borderRadius: 7,
            alignItems: 'center', justifyContent: 'center',
            color: C.ink500, background: 'transparent', border: 0, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <IconClose />
        </button>
      </div>

      {/* Nav: Principal */}
      <div style={{ padding: '16px 16px 4px' }}>
        <div className="sidebar-section-title" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink400, padding: '0 8px 6px' }}>
          Principal
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        <NavItem icon={<IconHome />} label="Início" active={route === 'inicio'} onClick={() => navigate('inicio')} />
        <NavItem icon={<IconDoc />} label="Empenhos" active={route === 'empenhos' || route === 'novo-empenho'} onClick={() => navigate('empenhos')} />
      </nav>

      {/* Nav: Administração */}
      {isAdmin && (
        <>
          <div style={{ padding: '16px 16px 4px' }}>
            <div className="sidebar-section-title" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink400, padding: '0 8px 6px' }}>
              Administração
            </div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
            <NavItem icon={<IconUpload />} label="Importar" active={route === 'import'} onClick={() => navigate('import')} />
            <NavItem icon={<IconSettings />} label="Configurações" active={route === 'config'} onClick={() => navigate('config')} />
            <NavItem icon={<IconActivity />} label="Auditoria" active={route === 'audit'} onClick={() => navigate('audit')} />
          </nav>
        </>
      )}

      {/* Expandir — aparece como item de nav quando retraído (desktop only) */}
      {isCollapsed && (
        <div className="sidebar-toggle" style={{ padding: '8px 12px 0' }}>
          <NavItem
            icon={<IconChevronRight />}
            label="Expandir"
            active={false}
            onClick={onToggle}
          />
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* User */}
      <div
        className="sidebar-user"
        style={{ borderTop: `1px solid ${C.line2}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.ink900, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          {initials}
        </div>
        <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
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
          aria-label="Sair da conta"
          style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: C.ink500, background: 'transparent', border: 0, cursor: 'pointer', transition: 'background .2s, color .2s', flexShrink: 0 }}
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

function Topbar({ route, onNovo, onMenuOpen }: { route: Route; onNovo: () => void; onMenuOpen: () => void }) {
  const showNovo = route === 'empenhos' || route === 'inicio';

  return (
    <header
      className="topbar-pad no-print"
      style={{
        background: '#fff',
        borderBottom: `1px solid ${C.line}`,
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
        {/* Hamburger — visible on mobile only */}
        <button
          className="hamburger"
          onClick={onMenuOpen}
          title="Abrir menu"
          aria-label="Abrir menu de navegação"
          style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            border: `1px solid ${C.line}`,
            background: 'transparent', cursor: 'pointer',
            color: C.ink700,
            transition: 'background .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bgSoft; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <IconMenu />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink500, whiteSpace: 'nowrap' }}>
            SEFIN
          </span>
          <span style={{ color: C.ink400, flexShrink: 0 }}>/</span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink900, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {routeLabels[route]}
          </span>
        </div>
      </div>

      {showNovo && (
        <button
          onClick={onNovo}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '9px 16px', background: C.ink900, color: '#fff',
            borderRadius: 10, fontWeight: 600, fontSize: 13,
            letterSpacing: '-0.005em', border: 0, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,22,34,.06)',
            fontFamily: 'Manrope, system-ui, sans-serif',
            whiteSpace: 'nowrap',
            transition: 'background .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.ink700; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.ink900; }}
        >
          <IconPlus />
          <span className="hidden sm:inline">Novo Empenho</span>
          <span className="sm:hidden">Novo</span>
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
        <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink500, marginBottom: 10 }}>
          Prefeitura Municipal de Parintins
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: 'clamp(22px, 4vw, 36px)', letterSpacing: '-0.025em', margin: '0 0 8px', lineHeight: 1.05, color: C.ink900 }}>
          Olá, {firstName}.
        </h1>
        <p style={{ color: C.ink500, fontSize: 14.5, margin: 0 }}>
          {dept} · Fichas de Empenho 2026
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
        <button
          onClick={onNovo}
          style={{
            background: '#fff', border: `1px solid ${C.line}`,
            borderRadius: 14, padding: '20px 20px 18px',
            textAlign: 'left', cursor: 'pointer',
            fontFamily: 'Manrope, system-ui, sans-serif',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow .2s, transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px -8px rgba(15,22,34,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#3ea3ff' }} />
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eaf4ff', display: 'grid', placeItems: 'center', marginBottom: 14, color: '#3ea3ff' }}>
            <IconPlus />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.ink900, marginBottom: 4 }}>Novo Empenho</div>
          <div style={{ fontSize: 13, color: C.ink500 }}>Registrar uma nova ficha de empenho</div>
        </button>
      </div>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function MainLayout() {
  const { user } = useAuthStore();
  const [route, setRoute] = useState<Route>('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const handleNovo = () => { setRoute('novo-empenho'); setSidebarOpen(false); };

  function toggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* */ }
      return next;
    });
  }

  // ESC key closes the mobile sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Mobile backdrop */}
      <div
        className={`app-backdrop${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        route={route}
        setRoute={setRoute}
        isAdmin={isAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleCollapse}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: C.bgSoft }}>
        <Topbar route={route} onNovo={handleNovo} onMenuOpen={() => setSidebarOpen(true)} />

        <main className="content-pad" style={{ padding: '24px 32px 56px', flex: 1 }}>
          <ErrorBoundary key={route}>
            {route === 'inicio' && <InicioPage onNovo={handleNovo} />}
            {(route === 'empenhos' || route === 'novo-empenho') && <EmpenhosPage />}
            {route === 'config' && isAdmin && <ConfigPage />}
            {route === 'import' && isAdmin && <ImportPage />}
            {route === 'audit' && isAdmin && <AuditPage />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
