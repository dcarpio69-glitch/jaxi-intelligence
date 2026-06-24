'use client';

import { useState } from 'react';
import JaxiLogo from '@/components/ui/JaxiLogo';
import { useLang } from '@/store/language';
import { useAuth } from '@/store/auth';

export default function LoginPage() {
  const { t, lang, setLang } = useLang();
  const { loginWithMicrosoft, loginWithProcore } = useAuth();
  const [loadingMs, setLoadingMs]   = useState(false);
  const [loadingPc, setLoadingPc]   = useState(false);

  const handleMicrosoft = async () => {
    setLoadingMs(true);
    await loginWithMicrosoft();
    // page will redirect — no need to reset
  };

  const handleProcore = async () => {
    setLoadingPc(true);
    await loginWithProcore();
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
        {/* Logo */}
        <JaxiLogo size="sm" />

        {/* Language switcher */}
        <div className="lang-switcher">
          <button id="lang-en-login" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>🇺🇸 EN</button>
          <button id="lang-es-login" className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>🇪🇸 ES</button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Logo badge — full official logo */}
          <div className="flex justify-center mb-8">
            <JaxiLogo size="lg" badge={true} />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-800 mb-2"
              style={{ color: 'var(--text-0)' }}
            >
              {t('loginTitle')}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Login buttons */}
          <div className="space-y-3">

            {/* ── Microsoft Outlook ──────────────────────── */}
            <button
              id="btn-login-microsoft"
              onClick={handleMicrosoft}
              disabled={loadingMs || loadingPc}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-strong)',
                cursor: loadingMs ? 'not-allowed' : 'pointer',
                opacity: loadingPc ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loadingMs && !loadingPc)
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,120,212,0.6)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }}
            >
              {/* Microsoft logo */}
              <div className="grid grid-cols-2 gap-0.5 shrink-0">
                <div className="w-4 h-4 bg-[#f25022]" />
                <div className="w-4 h-4 bg-[#7fba00]" />
                <div className="w-4 h-4 bg-[#00a4ef]" />
                <div className="w-4 h-4 bg-[#ffb900]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-600 text-[14px]" style={{ color: 'var(--text-0)' }}>
                  {lang === 'es' ? 'Continuar con Microsoft' : 'Continue with Microsoft'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>
                  Outlook · {lang === 'es' ? 'correos del proyecto' : 'project emails'}
                </p>
              </div>
              {loadingMs ? (
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: '#0078d4 transparent transparent transparent' }}
                />
              ) : (
                <span style={{ color: 'var(--text-3)' }}>→</span>
              )}
            </button>

            {/* ── Procore ────────────────────────────────── */}
            <button
              id="btn-login-procore"
              onClick={handleProcore}
              disabled={loadingMs || loadingPc}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-strong)',
                cursor: loadingPc ? 'not-allowed' : 'pointer',
                opacity: loadingMs ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!loadingMs && !loadingPc)
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(234,67,53,0.6)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }}
            >
              {/* Procore logo placeholder */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-800 text-sm shrink-0"
                style={{ background: '#ea4335', color: '#fff', letterSpacing: '-0.5px' }}
              >
                P
              </div>
              <div className="flex-1 text-left">
                <p className="font-600 text-[14px]" style={{ color: 'var(--text-0)' }}>
                  {lang === 'es' ? 'Continuar con Procore' : 'Continue with Procore'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {lang === 'es'
                    ? 'RFIs, Submittals · tus proyectos asignados'
                    : 'RFIs, Submittals · your assigned projects'}
                </p>
              </div>
              {loadingPc ? (
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: '#ea4335 transparent transparent transparent' }}
                />
              ) : (
                <span style={{ color: 'var(--text-3)' }}>→</span>
              )}
            </button>

          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {lang === 'es' ? 'o ambos' : 'or both'}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Info cards */}
          <div className="space-y-2">
            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
            >
              <span className="text-xl mt-0.5">🔀</span>
              <div>
                <p className="text-[12px] font-600" style={{ color: 'var(--text-1)' }}>
                  {lang === 'es' ? 'Cruce de datos automático' : 'Automatic data crossover'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {lang === 'es'
                    ? 'Conecta ambas cuentas para que JAXI AI detecte gaps entre Procore y tus emails'
                    : 'Connect both accounts so JAXI AI can detect gaps between Procore and your emails'}
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
            >
              <span className="text-xl mt-0.5">🏗️</span>
              <div>
                <p className="text-[12px] font-600" style={{ color: 'var(--text-1)' }}>
                  {lang === 'es' ? 'Solo tus proyectos asignados' : 'Only your assigned projects'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {lang === 'es'
                    ? 'Cada PM ve únicamente los proyectos de Procore donde está asignado'
                    : 'Each PM sees only the Procore projects where they are assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] mt-7" style={{ color: 'var(--text-3)' }}>
            {lang === 'es'
              ? 'Tus credenciales nunca se almacenan. Solo el token OAuth.'
              : 'Your credentials are never stored. Only the OAuth token.'}
          </p>

        </div>
      </div>
    </div>
  );
}
