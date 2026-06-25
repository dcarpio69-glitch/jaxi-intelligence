'use client';

import { useState } from 'react';
import JaxiLogo from '@/components/ui/JaxiLogo';
import { useLang } from '@/store/language';
import { useAuth } from '@/store/auth';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const { lang, setLang } = useLang();
  const { loginWithMicrosoft, loginWithProcore, loginWithEmail, registerWithEmail } = useAuth();

  const [tab, setTab]           = useState<Tab>('login');
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const es = lang === 'es';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError(es ? 'El nombre es requerido' : 'Name is required'); setLoading(false); return; }
        await registerWithEmail(email, name, password);
      }
    } catch (err: any) {
      setError(err.message || (es ? 'Ocurrió un error' : 'An error occurred'));
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--purple-900)',
        backgroundImage: `
          radial-gradient(ellipse at 20% 40%, rgba(79,70,229,0.15) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 10%, rgba(168,214,26,0.06) 0%, transparent 45%)
        `,
      }}
    >
      {/* ── Topbar ───────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <JaxiLogo size="sm" />
        <div className="lang-switcher">
          <button id="lang-en-login" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>🇺🇸 EN</button>
          <button id="lang-es-login" className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>🇪🇸 ES</button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <JaxiLogo size="lg" badge={true} />
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-800 mb-1" style={{ color: 'var(--text-0)' }}>
              JAXI Intelligence
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
              {es ? 'Inicia sesión para continuar' : 'Sign in to continue'}
            </p>
          </div>

          {/* ── Tabs ─────────────────────────────────────── */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
          >
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-600 transition-all"
                style={{
                  background: tab === t ? 'var(--surface-card)' : 'transparent',
                  color: tab === t ? 'var(--text-0)' : 'var(--text-3)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {t === 'login'
                  ? (es ? 'Iniciar sesión' : 'Sign in')
                  : (es ? 'Registrarse' : 'Register')}
              </button>
            ))}
          </div>

          {/* ── Email / Password Form ─────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-3 mb-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: 'var(--text-2)' }}>
                  {es ? 'Nombre completo' : 'Full name'}
                </label>
                <input
                  id="input-name"
                  type="text"
                  autoComplete="name"
                  required={tab === 'register'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={es ? 'Daniel Carpio' : 'Your name'}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-0)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--text-2)' }}>
                Email
              </label>
              <input
                id="input-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dcarpio@jaxi.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-0)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              />
            </div>

            <div>
              <label className="block text-xs font-600 mb-1" style={{ color: 'var(--text-2)' }}>
                {es ? 'Contraseña' : 'Password'}
              </label>
              <input
                id="input-password"
                type="password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-0)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#FF8C8C' }}
              >
                {error}
              </div>
            )}

            <button
              id="btn-submit-email"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-700 text-sm transition-all"
              style={{
                background: loading ? 'rgba(159,211,64,0.5)' : 'var(--accent)',
                color: '#1a1760',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? (es ? 'Entrando...' : 'Signing in...')
                : tab === 'login'
                  ? (es ? 'Entrar' : 'Sign in')
                  : (es ? 'Crear cuenta' : 'Create account')}
            </button>
          </form>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {es ? 'o continúa con' : 'or continue with'}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* ── OAuth Buttons ────────────────────────────── */}
          <div className="space-y-3">

            {/* Microsoft */}
            <button
              id="btn-login-microsoft"
              onClick={() => loginWithMicrosoft()}
              disabled={loading}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-strong)',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,120,212,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
            >
              <div className="grid grid-cols-2 gap-0.5 shrink-0">
                <div className="w-4 h-4 bg-[#f25022]" />
                <div className="w-4 h-4 bg-[#7fba00]" />
                <div className="w-4 h-4 bg-[#00a4ef]" />
                <div className="w-4 h-4 bg-[#ffb900]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-600 text-[13px]" style={{ color: 'var(--text-0)' }}>
                  {es ? 'Continuar con Microsoft' : 'Continue with Microsoft'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>
                  Outlook · {es ? 'correos del proyecto' : 'project emails'}
                </p>
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>→</span>
            </button>

            {/* Procore */}
            <button
              id="btn-login-procore"
              onClick={() => loginWithProcore()}
              disabled={loading}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-strong)',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(234,67,53,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-800 text-sm shrink-0"
                style={{ background: '#ea4335', color: '#fff' }}
              >
                P
              </div>
              <div className="flex-1 text-left">
                <p className="font-600 text-[13px]" style={{ color: 'var(--text-0)' }}>
                  {es ? 'Continuar con Procore' : 'Continue with Procore'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>
                  {es ? 'RFIs, Submittals · tus proyectos' : 'RFIs, Submittals · your projects'}
                </p>
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>→</span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] mt-6" style={{ color: 'var(--text-3)' }}>
            {es
              ? 'Tus credenciales nunca se almacenan. Solo el token OAuth.'
              : 'Your credentials are never stored. Only the OAuth token.'}
          </p>
        </div>
      </div>
    </div>
  );
}
