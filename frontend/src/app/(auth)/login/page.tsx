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
        if (!name.trim()) {
          setError(es ? 'El nombre es requerido' : 'Name is required');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, name, password);
      }
    } catch (err: any) {
      setError(err.message || (es ? 'Ocurrió un error' : 'An error occurred'));
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: '#1d1a76',
    border: '1px solid rgba(255,255,255,0.13)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#151263',
      backgroundImage: `
        radial-gradient(ellipse at 20% 40%, rgba(79,70,229,0.15) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 10%, rgba(141,198,63,0.06) 0%, transparent 45%)
      `,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* ── Topbar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <JaxiLogo size="sm" />
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
          <button
            id="lang-en-login"
            onClick={() => setLang('en')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
              background: lang === 'en' ? '#1d1a76' : 'transparent',
              color: lang === 'en' ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          >🇺🇸 EN</button>
          <button
            id="lang-es-login"
            onClick={() => setLang('es')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
              background: lang === 'es' ? '#1d1a76' : 'transparent',
              color: lang === 'es' ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          >🇪🇸 ES</button>
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <JaxiLogo size="lg" badge={true} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
              JAXI Intelligence
            </h1>
            <p style={{ fontSize: '14px', color: '#a9a4cc' }}>
              {es ? 'Inicia sesión para continuar' : 'Sign in to continue'}
            </p>
          </div>

          {/* ── Tabs ─────────────────────────────────────── */}
          <div style={{
            display: 'flex', borderRadius: '12px', padding: '4px', marginBottom: '24px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                  background: tab === t ? '#1d1a76' : 'transparent',
                  color: tab === t ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {t === 'login' ? (es ? 'Iniciar sesión' : 'Sign in') : (es ? 'Registrarse' : 'Register')}
              </button>
            ))}
          </div>

          {/* ── Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

            {tab === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a9a4cc', marginBottom: '6px' }}>
                  {es ? 'Nombre completo' : 'Full name'}
                </label>
                <input
                  id="input-name"
                  type="text"
                  required={tab === 'register'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={es ? 'Tu nombre' : 'Your name'}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#8DC63F')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.13)')}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a9a4cc', marginBottom: '6px' }}>
                Email
              </label>
              <input
                id="input-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dcarpio@jaxi.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#8DC63F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.13)')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a9a4cc', marginBottom: '6px' }}>
                {es ? 'Contraseña' : 'Password'}
              </label>
              <input
                id="input-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#8DC63F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.13)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', fontSize: '13px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <button
              id="btn-submit-email"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px 20px', borderRadius: '12px', border: 'none',
                fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(141,198,63,0.5)' : '#8DC63F',
                color: '#151263', transition: 'all 0.2s',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '12px', color: '#6b65a0' }}>{es ? 'o continúa con' : 'or continue with'}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── OAuth Buttons ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Microsoft */}
            <button
              id="btn-login-microsoft"
              onClick={() => loginWithMicrosoft()}
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 18px', borderRadius: '12px', cursor: 'pointer',
                background: '#1d1a76', border: '1px solid rgba(255,255,255,0.13)',
                opacity: loading ? 0.5 : 1, transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,120,212,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', background: '#f25022' }} />
                <div style={{ width: '16px', height: '16px', background: '#7fba00' }} />
                <div style={{ width: '16px', height: '16px', background: '#00a4ef' }} />
                <div style={{ width: '16px', height: '16px', background: '#ffb900' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff', margin: 0 }}>
                  {es ? 'Continuar con Microsoft' : 'Continue with Microsoft'}
                </p>
                <p style={{ fontSize: '11px', color: '#a9a4cc', margin: '2px 0 0' }}>
                  Outlook · {es ? 'correos del proyecto' : 'project emails'}
                </p>
              </div>
              <span style={{ color: '#6b65a0', fontSize: '14px' }}>→</span>
            </button>

            {/* Procore */}
            <button
              id="btn-login-procore"
              onClick={() => loginWithProcore()}
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 18px', borderRadius: '12px', cursor: 'pointer',
                background: '#1d1a76', border: '1px solid rgba(255,255,255,0.13)',
                opacity: loading ? 0.5 : 1, transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(234,67,53,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)')}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                background: '#ea4335', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '15px', color: '#fff',
              }}>
                P
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff', margin: 0 }}>
                  {es ? 'Continuar con Procore' : 'Continue with Procore'}
                </p>
                <p style={{ fontSize: '11px', color: '#a9a4cc', margin: '2px 0 0' }}>
                  {es ? 'RFIs, Submittals · tus proyectos' : 'RFIs, Submittals · your projects'}
                </p>
              </div>
              <span style={{ color: '#6b65a0', fontSize: '14px' }}>→</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', marginTop: '24px', color: '#6b65a0' }}>
            {es
              ? 'Tus credenciales nunca se almacenan. Solo el token OAuth.'
              : 'Your credentials are never stored. Only the OAuth token.'}
          </p>
        </div>
      </div>
    </div>
  );
}
