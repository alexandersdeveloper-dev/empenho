import { useState, type CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuthStore } from '@/shared/lib/authStore';
import { apiClient } from '@/shared/lib/apiClient';
import { LoginSchema, type LoginDto } from '@ficha-empenho/shared';

const S = {
  blue: '#3ea3ff',
  orange: '#b86a2b',
  yellow: '#ffb829',
  red: '#ea4242',
  ink900: '#0f1622',
  ink700: '#2a3344',
  ink500: '#5b667a',
  ink400: '#8590a3',
  ink300: '#b4bccb',
  line: '#e3e7ee',
} as const;

const stripe: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  background: `linear-gradient(90deg, ${S.blue} 0 25%, ${S.orange} 25% 50%, ${S.yellow} 50% 75%, ${S.red} 75% 100%)`,
};

const stripeBottom: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  height: 6,
};

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V5l-8-3z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="m7 14 4-4 4 4 5-5"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconEye({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, color: S.red }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

const features = [
  { icon: <IconShield />, color: S.blue, title: 'Acesso seguro e auditado', desc: 'Todas as operações registradas com trilha de auditoria completa.' },
  { icon: <IconChart />, color: S.yellow, title: 'Relatórios em tempo real', desc: 'Acompanhamento por departamento, exercício e categoria de despesa.' },
  { icon: <IconUsers />, color: S.red, title: 'Controle de usuários', desc: 'Atribua perfis e gerencie permissões por secretaria.' },
];

export function AuthPage() {
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { setUser, setLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginDto) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data: session } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (!session.session) throw new Error('Login falhou');

      const res = await apiClient.get('/users/me').catch(async () => {
        const { data: p } = await supabase
          .from('perfis')
          .select('*, departamento:departamentos(id,nome,sigla)')
          .eq('id', session.session!.user.id)
          .single();
        return { data: { ...p, email: session.session!.user.email } };
      });

      setUser(res.data);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">

      {/* ── Left: brand panel ── */}
      <aside className="auth-brand" style={{
        position: 'relative',
        background: S.ink900,
        color: '#fff',
        padding: '56px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        <div style={stripe} />

        {/* Watermark */}
        <div aria-hidden style={{
          position: 'absolute', right: -40, bottom: -30,
          fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700,
          fontSize: 200, letterSpacing: '-0.03em',
          color: 'rgba(255,255,255,0.025)', lineHeight: 0.85,
          pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
        }}>
          PARINTINS
        </div>

        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 2 }}>
          <img src="/logo.png" alt="Prefeitura de Parintins" style={{ height: 56, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <div style={{ width: 1, height: 38, background: 'rgba(255,255,255,0.18)' }} />
          <div>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Secretaria de Finanças
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>Fichas de Empenho</div>
          </div>
        </div>

        {/* Mid content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 540 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 12px 6px 8px', borderRadius: 999,
            background: 'rgba(62,163,255,0.14)', color: '#8ec6ff',
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 11,
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
            marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: S.blue, boxShadow: '0 0 0 3px rgba(62,163,255,0.25)', display: 'inline-block' }} />
            Acesso restrito · SEFIN 2026
          </div>

          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600,
            fontSize: 'clamp(32px, 3.2vw, 48px)', lineHeight: 1.05,
            letterSpacing: '-0.025em', margin: '0 0 22px', color: '#fff',
          }}>
            Gestão de empenhos da{' '}
            <span style={{
              fontStyle: 'italic', fontWeight: 500,
              background: `linear-gradient(95deg, ${S.blue}, ${S.yellow} 60%, ${S.red})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              administração municipal
            </span>
            .
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', maxWidth: '48ch', margin: '0 0 36px' }}>
            Plataforma oficial para registro, controle e acompanhamento das fichas de empenho da Prefeitura Municipal de Parintins.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'grid', placeItems: 'center',
                  flexShrink: 0, color: f.color,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', justifyContent: 'space-between', gap: 24,
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 11,
          letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        }}>
          <span>SEFIN · Parintins · AM</span>
          <span>v 2.0.0</span>
        </div>
      </aside>

      {/* ── Right: form panel ── */}
      <section className="auth-form-pad" style={{
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 460, width: '100%', margin: '0 auto' }}>

          {/* Breadcrumbs */}
          <div style={{
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: S.ink500, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36,
          }}>
            <span>SEFIN</span>
            <span style={{ color: S.ink300 }}>/</span>
            <span>Fichas de Empenho</span>
            <span style={{ color: S.ink300 }}>/</span>
            <span style={{ color: S.ink900, fontWeight: 600 }}>Acesso</span>
          </div>

          <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: S.blue, marginBottom: 12 }}>
            Entrar no sistema
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 12px', color: S.ink900 }} className="text-[28px] sm:text-[34px] md:text-[38px]">
            Bem-vindo de volta.
          </h2>
          <p style={{ color: S.ink500, fontSize: 14.5, lineHeight: 1.55, margin: '0 0 36px' }}>
            Acesse com suas credenciais institucionais para gerenciar as fichas de empenho.
          </p>

          {/* Error alert */}
          {errorMsg && (
            <div style={{
              marginBottom: 18, padding: '12px 14px',
              background: '#fef5f5', border: '1px solid #fde0e0',
              borderRadius: 10, color: '#8b2424',
              fontSize: 13, display: 'flex', alignItems: 'start', gap: 10,
            }}>
              <IconAlert />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              <label htmlFor="auth-email" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.ink500, fontWeight: 500 }}>
                E-mail institucional
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 14, color: S.ink400, display: 'flex', pointerEvents: 'none' }}>
                  <IconMail />
                </span>
                <input
                  id="auth-email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu.nome@parintins.am.gov.br"
                  style={{
                    width: '100%', border: `1px solid ${errors.email ? S.red : S.line}`,
                    borderRadius: 10, padding: '14px 16px 14px 44px',
                    fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 14.5,
                    color: S.ink900, background: '#fff', outline: 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = S.ink900; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(15,22,34,.05)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.email ? S.red : S.line; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              {errors.email && <span style={{ fontSize: 12, color: S.red }}>{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              <label htmlFor="auth-pw" style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.ink500, fontWeight: 500 }}>
                Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 14, color: S.ink400, display: 'flex', pointerEvents: 'none' }}>
                  <IconLock />
                </span>
                <input
                  id="auth-pw"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  style={{
                    width: '100%', border: `1px solid ${errors.password ? S.red : S.line}`,
                    borderRadius: 10, padding: '14px 48px 14px 44px',
                    fontFamily: 'Manrope, system-ui, sans-serif', fontSize: 14.5,
                    color: S.ink900, background: '#fff', outline: 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = S.ink900; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(15,22,34,.05)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.password ? S.red : S.line; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label="Mostrar senha"
                  style={{
                    position: 'absolute', right: 12,
                    width: 30, height: 30, borderRadius: 6,
                    display: 'grid', placeItems: 'center',
                    color: S.ink400, background: 'transparent', border: 0, cursor: 'pointer',
                  }}
                >
                  <IconEye off={showPw} />
                </button>
              </div>
              {errors.password && <span style={{ fontSize: 12, color: S.red }}>{errors.password.message}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '16px 22px',
                background: isLoading ? S.ink700 : S.ink900,
                color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15,
                letterSpacing: '-0.005em', border: 0, cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 24px -8px rgba(15,22,34,.25)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'transform .15s, background .2s, box-shadow .2s',
                fontFamily: 'Manrope, system-ui, sans-serif',
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 24px 60px -20px rgba(15,22,34,.3)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px -8px rgba(15,22,34,.25)'; }}
            >
              {isLoading ? 'Validando...' : 'Entrar no sistema'}
              {!isLoading && <IconArrow />}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: S.ink500 }}>
            Problemas para acessar? Fale com a{' '}
            <a href="#" onClick={e => e.preventDefault()} style={{ color: S.blue, fontWeight: 600 }}>
              Equipe de TI
            </a>
            .
          </div>
        </div>

        {/* Bottom stripe */}
        <div style={stripeBottom} aria-hidden>
          <span style={{ background: S.blue }} />
          <span style={{ background: S.orange }} />
          <span style={{ background: S.yellow }} />
          <span style={{ background: S.red }} />
        </div>
      </section>
    </div>
  );
}
