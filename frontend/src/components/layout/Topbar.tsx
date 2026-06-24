'use client';

import { useLang } from '@/store/language';
import { useProject } from '@/store/project';

export default function Topbar() {
  const { lang, setLang, t } = useLang();
  const { selectedProject } = useProject();

  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      {/* ── Logo ─────────────────────────────────── */}
      <div className="flex items-center gap-3 mr-4">
        {/* JAXI grid logo */}
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--lime)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--lime)' }} />
          </div>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--lime)', opacity: 0.7 }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--lime)', opacity: 0.4 }} />
          </div>
        </div>
        <div>
          <p className="text-[13px] font-800 leading-tight" style={{ color: 'var(--text-0)' }}>
            JAXI<span style={{ color: 'var(--lime)' }}>.</span>BUILDERS<span className="font-400" style={{ color: 'var(--text-2)' }}>.INC</span>
          </p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--text-2)' }}>
            {t('appSub')}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* ── Language switcher ─────────────────────── */}
      <div className="lang-switcher">
        <button
          id="lang-en"
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang('en')}
        >
          🇺🇸 EN
        </button>
        <button
          id="lang-es"
          className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
          onClick={() => setLang('es')}
        >
          🇪🇸 ES
        </button>
      </div>

      {/* ── Theme toggle ─────────────────────────── */}
      <button className="theme-toggle" id="btn-theme">🌙</button>

      {/* ── Project info (top right) ─────────────── */}
      {selectedProject && (
        <div className="text-right pl-4 border-l" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[13px] font-700" style={{ color: 'var(--text-0)' }}>
            {selectedProject.name} · {selectedProject.code}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>{today}</p>
        </div>
      )}
    </header>
  );
}
