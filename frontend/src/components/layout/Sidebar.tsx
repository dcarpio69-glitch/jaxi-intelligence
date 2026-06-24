'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Premium Data-Management SVG Icons ───────────────────────────────────────
// Each icon is purpose-built for its section: precise, modern, construction-PM focused
const Icons = {
  // Projects → layered data sheets (portfolio / project pipeline)
  Projects: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),

  // RFIs → document with question mark + data lines (request for information)
  RFIs: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9.5 13a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),

  // Submittals → upload/send with approval checkmark (submittal review flow)
  Submittals: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
      <polyline points="8 18 12 22 16 18"/>
    </svg>
  ),

  // Intelligence → neural network / AI nodes (cross-analysis engine)
  Intelligence: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <circle cx="4"  cy="19" r="2"/>
      <circle cx="20" cy="19" r="2"/>
      <circle cx="12" cy="13" r="2"/>
      <line x1="12" y1="7"  x2="12" y2="11"/>
      <line x1="12" y1="15" x2="4"  y2="17"/>
      <line x1="12" y1="15" x2="20" y2="17"/>
      <line x1="12" y1="7"  x2="4"  y2="17"/>
      <line x1="12" y1="7"  x2="20" y2="17"/>
    </svg>
  ),

  // Settings → sliders / configuration dials (data pipeline config)
  Settings: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4"  y1="6"  x2="20" y2="6"/>
      <line x1="4"  y1="12" x2="20" y2="12"/>
      <line x1="4"  y1="18" x2="20" y2="18"/>
      <circle cx="8"  cy="6"  r="2" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
    </svg>
  ),
};

// ─── Integration status ───────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface IntegStatus { outlook: boolean; procore: boolean; emailThreads?: number; }

export default function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus]     = useState<IntegStatus | null>(null);
  const [rfiOverdue, setRfiOv]  = useState(0);
  const [subOverdue, setSubOv]  = useState(0);

  useEffect(() => {
    fetch(`${API}/integrations/status`)
      .then(r => r.json())
      .then(d => setStatus({
        outlook: d.integrations?.outlook ?? d.outlook ?? false,
        procore: d.integrations?.procore ?? d.procore ?? false,
        emailThreads: d.stats?.emailThreads ?? 0,
      }))
      .catch(() => setStatus({ outlook: false, procore: false }));

    fetch(`${API}/data/summary?projectId=6008`)
      .then(r => r.json())
      .then(d => {
        setRfiOv(d.rfis?.overdue ?? 0);
        setSubOv(d.submittals?.overdue ?? 0);
      })
      .catch(() => {});

    const iv = setInterval(() => {
      fetch(`${API}/integrations/status`)
        .then(r => r.json())
        .then(d => setStatus({
          outlook: d.integrations?.outlook ?? d.outlook ?? false,
          procore: d.integrations?.procore ?? d.procore ?? false,
        }))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const { lang, toggle, t } = useLanguage();

  const isConnected = status?.outlook && status?.procore;
  const isPartial   = (status?.outlook || status?.procore) && !isConnected;
  const statusColor = isConnected ? '#9FD340' : isPartial ? '#FFC24D' : '#FF6B6B';
  const statusBg    = isConnected ? 'rgba(159,211,64,0.08)' : isPartial ? 'rgba(255,194,77,0.08)' : 'rgba(255,107,107,0.08)';
  const statusBorder= isConnected ? 'rgba(159,211,64,0.2)'  : isPartial ? 'rgba(255,194,77,0.2)'  : 'rgba(255,107,107,0.2)';
  const statusLabel = isConnected ? t('status.live') : isPartial ? t('status.partial') : t('status.offline');

  const navGroups = [
    {
      label: t('nav.principal'),
      items: [
        { href:'/projects',     Icon:Icons.Projects,     label:t('nav.projects'),     id:'nav-projects' },
      ],
    },
    {
      label: t('nav.coordination'),
      items: [
        { href:'/rfis',         Icon:Icons.RFIs,         label:t('nav.rfis'),         id:'nav-rfis',         badge: rfiOverdue > 0 ? rfiOverdue : undefined, badgeColor:'#FF8C8C' },
        { href:'/submittals',   Icon:Icons.Submittals,   label:t('nav.submittals'),   id:'nav-submittals',   badge: subOverdue > 0 ? subOverdue : undefined, badgeColor:'#FFC24D' },
      ],
    },
    {
      label: t('nav.ai'),
      items: [
        { href:'/intelligence', Icon:Icons.Intelligence, label:t('nav.intelligence'), id:'nav-intelligence', tag:'AI', tagColor:'#93C5FD' },
      ],
    },
    {
      label: t('nav.system'),
      items: [
        { href:'/settings',     Icon:Icons.Settings,     label:t('nav.settings'),     id:'nav-settings',     tag: !isConnected ? t('status.demo') : undefined, tagColor:'#FF8C8C' },
      ],
    },
  ];

  return (
    <aside style={{
      width: 224, flexShrink: 0,
      background: '#16145a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .sb-item {
          display:flex; align-items:center; gap:10px;
          padding:8px 12px; border-radius:9px; margin:1px 8px;
          text-decoration:none; font-size:13px; font-weight:500;
          color:rgba(255,255,255,0.40);
          transition:all .18s ease;
          font-family:'Inter',sans-serif;
          position:relative;
        }
        .sb-item:hover {
          background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.85);
        }
        .sb-item:hover .sb-icon-wrap {
          color:rgba(255,255,255,0.85);
          background:rgba(255,255,255,0.09);
        }
        .sb-item.active {
          background:linear-gradient(90deg,rgba(159,211,64,0.15),rgba(159,211,64,0.04));
          color:#9FD340;
          font-weight:700;
          border:1px solid rgba(159,211,64,0.18);
          box-shadow:inset 0 0 14px rgba(159,211,64,0.05);
        }
        .sb-item.active .sb-icon-wrap {
          color:#9FD340;
          background:rgba(159,211,64,0.16);
          box-shadow:0 0 10px rgba(159,211,64,0.30);
        }
        .sb-item.active::before {
          content:'';
          position:absolute; left:0; top:22%; bottom:22%;
          width:3px; border-radius:0 3px 3px 0;
          background:#9FD340;
          box-shadow:0 0 10px rgba(159,211,64,0.7);
          margin-left:-12px;
        }
        .sb-icon-wrap {
          width:30px; height:30px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
          color:rgba(255,255,255,0.30);
          transition:all .18s ease;
          background:rgba(255,255,255,0.04);
        }
        .sb-label { flex:1; }
        .sb-badge {
          font-size:10px; font-weight:800; min-width:18px; height:18px;
          border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 5px;
        }
        .sb-tag { font-size:9px; font-weight:700; padding:2px 6px; border-radius:5px; letter-spacing:.04em; }
        .sb-group { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
          color:rgba(255,255,255,0.18); padding:14px 20px 4px; font-family:'Inter',sans-serif; }
        .sb-sep { height:1px; background:rgba(255,255,255,0.04); margin:4px 14px; }
        @keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes pulse-warn { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,.6)} 50%{box-shadow:0 0 0 4px rgba(255,107,107,0)} }
      `}</style>

      {/* ── Logo ── */}
      <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* JAXI 2×2 grid mark */}
          <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
            <div style={{ display:'flex', gap:3 }}>
              <div style={{ width:11, height:11, borderRadius:2, background:'#9FD340' }}/>
              <div style={{ width:11, height:11, borderRadius:2, background:'#9FD340' }}/>
            </div>
            <div style={{ display:'flex', gap:3 }}>
              <div style={{ width:11, height:11, borderRadius:2, background:'rgba(159,211,64,0.55)' }}/>
              <div style={{ width:11, height:11, borderRadius:2, background:'rgba(159,211,64,0.28)' }}/>
            </div>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#ffffff', fontFamily:'Inter,sans-serif', letterSpacing:'.02em', lineHeight:1.1 }}>
              JAXI
              <span style={{ color:'#9FD340' }}>.</span>
              <span style={{ fontWeight:400, color:'rgba(255,255,255,0.55)', fontSize:12 }}>BUILDERS</span>
            </div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', fontFamily:'Inter,sans-serif', letterSpacing:'.08em', textTransform:'uppercase', marginTop:1 }}>Intelligence Platform</div>
          </div>
        </div>
      </div>

      {/* ── Connection status ── */}
      <div style={{ padding:'10px 14px 6px' }}>
        <Link href="/settings" style={{ textDecoration:'none' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:7,
            background: statusBg, border:`1px solid ${statusBorder}`,
            borderRadius:8, padding:'7px 10px', cursor:'pointer',
            transition:'all .2s',
            animation: !isConnected ? 'pulse-warn 2s ease-in-out infinite' : 'none',
          }}>
            {/* Live data pulse dot */}
            <span style={{
              width:7, height:7, borderRadius:'50%', flexShrink:0,
              background: statusColor,
              animation: isConnected ? 'pulse-live 2s ease-in-out infinite' : 'none',
            }}/>
            <span style={{ fontSize:10, fontWeight:700, color: statusColor, fontFamily:'Inter,sans-serif', flex:1 }}>
              {statusLabel}
            </span>
            {/* Pipeline icon — data flowing */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isConnected ? (
                // Connected: sync arrows
                <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></>
              ) : (
                // Not connected: external link → go to settings
                <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></>
              )}
            </svg>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex:1, paddingBottom:8, overflowY:'auto' }}>
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="sb-sep"/>}
            <div className="sb-group">{group.label}</div>
            {group.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} id={item.id} className={`sb-item ${isActive?'active':''}`}>
                  <span className="sb-icon-wrap">
                    <item.Icon />
                  </span>
                  <span className="sb-label">{item.label}</span>
                  {'badge' in item && item.badge !== undefined && (
                    <span className="sb-badge" style={{
                      background:`${item.badgeColor}20`, color:item.badgeColor, border:`1px solid ${item.badgeColor}40`,
                    }}>{item.badge}</span>
                  )}
                  {'tag' in item && item.tag && (
                    <span className="sb-tag" style={{
                      background: item.tag === 'DEMO' ? 'rgba(255,107,107,0.12)' : 'rgba(147,197,253,0.12)',
                      color: item.tag === 'DEMO' ? '#FF8C8C' : '#93C5FD',
                      border: `1px solid ${item.tag === 'DEMO' ? 'rgba(255,107,107,0.25)' : 'rgba(147,197,253,0.25)'}`,
                    }}>{item.tag}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Language toggle + User ── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'10px 14px' }}>
        <button
          id="lang-toggle"
          onClick={toggle}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:8, padding:'7px 10px', cursor:'pointer', marginBottom:8,
            transition:'all .15s', color:'rgba(255,255,255,0.5)', fontFamily:'Inter,sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.04)')}
        >
          <span style={{ fontSize:14 }}>{lang === 'es' ? '🇺🇸' : '🇪🇸'}</span>
          <span style={{ fontSize:11, fontWeight:600 }}>
            {lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          </span>
        </button>

        <Link href="/settings" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', padding:'8px 8px', borderRadius:9, transition:'background .15s' }}
          onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background='transparent')}
        >
          <div style={{
            width:30, height:30, borderRadius:7, flexShrink:0,
            background:'linear-gradient(135deg,#322A81,#9FD340)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:12, color:'#fff',
          }}>D</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.75)', lineHeight:1.2, fontFamily:'Inter,sans-serif' }}>Daniel Carpio</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'Inter,sans-serif' }}>JAXI Builders</div>
          </div>
          <Icons.Settings />
        </Link>
      </div>
    </aside>
  );
}
