import { useState } from 'react';
import { useAuthStore } from '@/shared/lib/authStore';
import { EmpenhosPage } from '@/features/empenhos/components/EmpenhosPage';
import { ConfigPage } from '@/features/config/ConfigPage';
import { ImportPage } from '@/features/import/ImportPage';
import { AuditPage } from '@/features/audit/AuditPage';

type Route = 'inicio' | 'empenhos' | 'novo-empenho' | 'config' | 'import' | 'audit';

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const [route, setRoute] = useState<Route>('inicio');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="no-print bg-brand-700 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">Fichas de Empenho</span>
            <nav className="flex gap-4 text-sm">
              <button
                onClick={() => setRoute('inicio')}
                className={`hover:text-blue-200 ${route === 'inicio' ? 'font-semibold underline' : ''}`}
              >
                Início
              </button>
              <button
                onClick={() => setRoute('empenhos')}
                className={`hover:text-blue-200 ${route === 'empenhos' ? 'font-semibold underline' : ''}`}
              >
                Empenhos
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setRoute('import')}
                    className={`hover:text-blue-200 ${route === 'import' ? 'font-semibold underline' : ''}`}
                  >
                    Importar
                  </button>
                  <button
                    onClick={() => setRoute('config')}
                    className={`hover:text-blue-200 ${route === 'config' ? 'font-semibold underline' : ''}`}
                  >
                    Configurações
                  </button>
                  <button
                    onClick={() => setRoute('audit')}
                    className={`hover:text-blue-200 ${route === 'audit' ? 'font-semibold underline' : ''}`}
                  >
                    Auditoria
                  </button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-75">
              {user?.nome} · {user?.departamento?.sigla ?? 'Geral'}
            </span>
            <button
              onClick={() => logout()}
              className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl w-full px-4 py-6 flex-1">
        {route === 'inicio' && <InicioPage onNovo={() => setRoute('novo-empenho')} />}
        {(route === 'empenhos' || route === 'novo-empenho') && (
          <EmpenhosPage />
        )}
        {route === 'config' && isAdmin && <ConfigPage />}
        {route === 'import' && isAdmin && <ImportPage />}
        {route === 'audit' && isAdmin && <AuditPage />}
      </main>
    </div>
  );
}

function InicioPage({ onNovo }: { onNovo: () => void }) {
  const { user } = useAuthStore();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Bem-vindo, {user?.nome?.split(' ')[0]}
      </h1>
      <p className="text-gray-500 mb-6">
        Prefeitura Municipal de Parintins ·{' '}
        {user?.departamento?.nome ?? 'Departamento Geral'}
      </p>
      <button
        onClick={onNovo}
        className="rounded-lg bg-brand-600 text-white px-5 py-2.5 font-medium hover:bg-brand-700 transition"
      >
        + Novo Empenho
      </button>
    </div>
  );
}

