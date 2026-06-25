'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface IntegrationStatus {
  outlook: boolean;
  procore: boolean;
  emailThreads?: number;
  lastSync?: string | null;
  stats?: { emailThreads: number; lastOutlookSync: string | null };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
:root {
  --bg: #0f0d3a;
  --card: #17145a;
  --purple: #322A81;
  --lime: #8DC63F;
  --amber: #FFC24D;
  --red: #FF8C8C;
  --blue: #93C5FD;
  --txt: #e8e6ff;
  --muted: #a9a4cc;
  --line: rgba(255,255,255,0.08);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--txt); font-family: 'Inter', sans-serif; }
.wrap { max-width: 760px; margin: 0 auto; padding: 40px 24px 80px; }
h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
.sub { font-size: 14px; color: var(--muted); margin-bottom: 36px; line-height: 1.6; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 26px; margin-bottom: 20px; }
.card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.card-head h2 { font-size: 16px; font-weight: 700; flex: 1; }
.badge { font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.badge-connected { background: rgba(141,198,63,.15); color: var(--lime); border: 1px solid rgba(141,198,63,.3); }
.badge-warn { background: rgba(255,194,77,.12); color: var(--amber); border: 1px solid rgba(255,194,77,.25); }
.badge-loading { background: rgba(255,255,255,.05); color: var(--muted); border: 1px solid var(--line); }
.desc { font-size: 13px; color: var(--muted); margin-bottom: 20px; line-height: 1.65; }
.connect-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 13px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .15s; font-family: 'Inter', sans-serif; }
.btn-ms { background: #2F7AD6; color: #fff; }
.btn-ms:hover { background: #2568ba; }
.btn-pc { background: var(--lime); color: #0f0d3a; }
.btn-pc:hover { filter: brightness(1.1); }
.btn-sync { display:inline-flex; align-items:center; gap:7px; background: rgba(141,198,63,.1); color: var(--lime); border: 1px solid rgba(141,198,63,.25); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: .15s; }
.btn-sync:hover { background: rgba(141,198,63,.18); }
.btn-sync:disabled { opacity:.5; cursor:not-allowed; }
.btn-disconnect { display:inline-flex; align-items:center; gap:7px; background: rgba(255,140,140,.08); color: var(--red); border: 1px solid rgba(255,140,140,.2); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: .15s; }
.btn-disconnect:hover { background: rgba(255,140,140,.15); }
.btn-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap:wrap; }
.env-block { background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.06); border-left: 3px solid var(--lime); border-radius: 10px; padding: 14px 16px; margin-top: 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 2; color: var(--muted); }
.stat-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(141,198,63,.06); border: 1px solid rgba(141,198,63,.15); border-radius: 10px; font-size: 13px; color: var(--muted); }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: var(--lime); box-shadow: 0 0 6px rgba(141,198,63,.5); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.toast { position: fixed; bottom: 24px; right: 24px; background: rgba(141,198,63,.15); color: var(--lime); border: 1px solid rgba(141,198,63,.3); border-radius: 12px; padding: 12px 20px; font-size: 14px; font-weight: 600; z-index: 100; backdrop-filter: blur(12px); font-family: 'Inter', sans-serif; }
.toast.error { background: rgba(255,140,140,.12); color: var(--red); border-color: rgba(255,140,140,.3); }
.topbar { height: 4px; background: linear-gradient(90deg, var(--lime), #4ade80); }
code { font-family: 'JetBrains Mono', monospace; background: rgba(0,0,0,.3); padding: 1px 6px; border-radius: 4px; font-size: 12px; color: var(--lime); }
.step-item { display:flex; gap:12px; align-items:flex-start; }
.step-num { width:28px; height:28px; border-radius:8px; background:rgba(141,198,63,.12); border:1px solid rgba(141,198,63,.22); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:var(--lime); flex-shrink:0; }
`;

function SettingsContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingProcore, setSyncingProcore] = useState(false);

  const en = lang === 'en';

  const showToast = (msg: string, type: 'ok' | 'error' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${API}/integrations/status`);
      const d = await r.json();
      setStatus({
        outlook: d.integrations?.outlook ?? d.outlook ?? false,
        procore: d.integrations?.procore ?? d.procore ?? false,
        emailThreads: d.stats?.emailThreads ?? 0,
        lastSync: d.stats?.lastOutlookSync ?? null,
      });
    } catch {
      setStatus({ outlook: false, procore: false, emailThreads: 0, lastSync: null });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const user = searchParams.get('user');

    if (connected === 'outlook') {
      showToast(`✅ Outlook ${en ? 'connected' : 'conectado'}${user ? ` — ${user}` : ''}. ${en ? 'Syncing emails...' : 'Sincronizando emails...'}`);
      fetchStatus();
    } else if (connected === 'procore') {
      showToast(`✅ Procore ${en ? 'connected' : 'conectado'}${user ? ` — ${user}` : ''}. ${en ? 'Importing projects...' : 'Importando proyectos...'}`);
      fetchStatus();
    } else if (error) {
      const msgs: Record<string, Record<string, string>> = {
        outlook_auth_failed: { es: 'Error de autenticacion con Outlook', en: 'Outlook authentication failed' },
        outlook_token_failed: { es: 'Error al obtener token de Outlook', en: 'Failed to get Outlook token' },
        outlook_no_code: { es: 'No se recibio codigo de autorizacion', en: 'Authorization code not received' },
        procore_auth_failed: { es: 'Error de autenticacion con Procore', en: 'Procore authentication failed' },
        procore_token_failed: { es: 'Error al obtener token de Procore', en: 'Failed to get Procore token' },
      };
      showToast(msgs[error]?.[lang] || `Error: ${error}`, 'error');
    }
  }, [searchParams]);

  const connectOutlook  = () => { window.location.href = `${API}/integrations/outlook/connect`; };
  const connectProcore  = () => { window.location.href = `${API}/integrations/procore/connect`; };

  const disconnectOutlook = async () => {
    if (!confirm(en ? 'Disconnect Outlook? The access token will be removed.' : '¿Desconectar Outlook? Se eliminará el token de acceso.')) return;
    await fetch(`${API}/integrations/outlook`, { method: 'DELETE' });
    showToast(en ? 'Outlook disconnected' : 'Outlook desconectado', 'error');
    fetchStatus();
  };

  const disconnectProcore = async () => {
    if (!confirm(en ? 'Disconnect Procore? The access token will be removed.' : '¿Desconectar Procore? Se eliminará el token de acceso.')) return;
    await fetch(`${API}/integrations/procore/disconnect`, { method: 'POST' });
    showToast(en ? 'Procore disconnected' : 'Procore desconectado', 'error');
    fetchStatus();
  };

  const syncOutlook = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`${API}/integrations/outlook/sync`, { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        showToast(en ? `Sync complete — ${d.emailsSynced} emails imported` : `Sync completada — ${d.emailsSynced} emails importados`);
        fetchStatus();
      } else {
        showToast(d.error || (en ? 'Sync error' : 'Error en sincronización'), 'error');
      }
    } catch {
      showToast(en ? 'Could not connect to server' : 'No se pudo conectar con el servidor', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const syncProcore = async () => {
    setSyncingProcore(true);
    try {
      const r = await fetch(`${API}/integrations/procore/sync`, { method: 'POST' });
      const d = await r.json();
      showToast(d.message || (en ? 'Procore sync started — data refreshes in ~30s' : 'Sync Procore iniciado — datos se actualizan en ~30s'));
      setTimeout(() => { fetchStatus(); setSyncingProcore(false); }, 35000);
    } catch {
      showToast(en ? 'Sync error' : 'Error al sincronizar', 'error');
      setSyncingProcore(false);
    }
  };

  const outlookOk  = status?.outlook  ?? false;
  const procoreOk  = status?.procore  ?? false;
  const emailCount = status?.stats?.emailThreads ?? status?.emailThreads ?? 0;
  const lastSync   = status?.stats?.lastOutlookSync ?? status?.lastSync;

  const steps = en ? [
    { n:'1', t:'Secure OAuth Login',  d:'Microsoft and Procore ask you to authorize JAXI — tokens are stored encrypted in the database.' },
    { n:'2', t:'Initial Data Import', d:'All your active projects, RFIs and Submittals are fetched from Procore.' },
    { n:'3', t:'Email Cross-Reference', d:'JAXI searches your Outlook for emails matching each RFI/Submittal and detects commitments.' },
    { n:'4', t:'Live Dashboard', d:'The DEMO badge disappears and the sidebar shows LIVE DATA. Data refreshes every 30 min.' },
  ] : [
    { n:'1', t:'Login OAuth seguro', d:'Microsoft y Procore te piden autorizar JAXI — los tokens se guardan encriptados en la base de datos.' },
    { n:'2', t:'Importación inicial', d:'Se traen todos tus proyectos, RFIs y Submittals activos de Procore.' },
    { n:'3', t:'Cruce de emails', d:'JAXI busca en tu Outlook emails con keywords de cada RFI/Submittal y detecta compromisos.' },
    { n:'4', t:'Dashboard en vivo', d:'El badge DEMO desaparece y el sidebar muestra DATOS EN VIVO. Los datos se refrescan cada 30 min.' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}

      <div className="topbar" />
      <div className="wrap">

        {/* Header */}
        <div style={{ padding:'24px 0 0', marginBottom:36 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(159,211,64,0.12)', border:'1px solid rgba(159,211,64,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FD340" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <h1>{en ? 'Connection Settings' : 'Configuración de Conexiones'}</h1>
          </div>
          <p className="sub">
            {en
              ? 'Connect Microsoft Outlook and Procore to get real-time data. Tokens are stored securely in the database.'
              : 'Conecta Microsoft Outlook y Procore para obtener datos en tiempo real. Los tokens se guardan de forma segura en la base de datos.'}
          </p>
        </div>

        {/* ── Microsoft Outlook ── */}
        <div className="card">
          <div className="card-head">
            <div style={{ width:38, height:38, borderRadius:9, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>
              </svg>
            </div>
            <h2>Microsoft Outlook</h2>
            {status === null
              ? <span className="badge badge-loading">{en ? 'Checking...' : 'Verificando...'}</span>
              : outlookOk
                ? <span className="badge badge-connected">CONNECTED</span>
                : <span className="badge badge-warn">{en ? 'Not Connected' : 'Sin conexión'}</span>}
          </div>

          <p className="desc">
            {en
              ? <>{`Reads project emails from Outlook, detects commitments and cross-references them with Procore RFIs/Submittals. Add credentials to `}<code>backend/.env</code>{` first.`}</>
              : <>{`Lee emails de proyectos de Outlook, detecta compromisos y los cruza con los RFIs/Submittals de Procore. Necesitas las credenciales en `}<code>backend/.env</code>{` primero.`}</>}
          </p>

          {outlookOk ? (
            <>
              <div className="stat-row">
                <span className="stat-dot dot-green" />
                <span>
                  <strong>{emailCount}</strong>{' '}
                  {en ? 'email threads imported' : 'email threads importados'}
                  {lastSync && `  —  ${en ? 'Last sync' : 'Última sync'}: ${new Date(lastSync).toLocaleString(en ? 'en-US' : 'es-US')}`}
                </span>
              </div>
              <div className="btn-row">
                <button className="btn-sync" onClick={syncOutlook} disabled={syncing}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  {syncing ? (en ? 'Syncing...' : 'Sincronizando...') : (en ? 'Sync Now' : 'Sincronizar ahora')}
                </button>
                <button className="btn-disconnect" onClick={disconnectOutlook}>
                  {en ? 'Disconnect' : 'Desconectar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="env-block">
                <div>MICROSOFT_CLIENT_ID={en ? 'your_azure_client_id' : 'tu_azure_client_id'}</div>
                <div>MICROSOFT_CLIENT_SECRET={en ? 'your_client_secret' : 'tu_client_secret'}</div>
                <div>MICROSOFT_TENANT_ID=common</div>
                <div>MICROSOFT_REDIRECT_URI=https://jaxi-backend-production.up.railway.app/api/v1/integrations/outlook/callback</div>
              </div>
              <button className="connect-btn btn-ms" style={{ marginTop:16 }} onClick={connectOutlook}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 7 12 13 22 7"/>
                </svg>
                {en ? 'Connect with Microsoft Outlook' : 'Conectar con Microsoft Outlook'}
              </button>
            </>
          )}
        </div>

        {/* ── Procore ── */}
        <div className="card">
          <div className="card-head">
            <div style={{ width:38, height:38, borderRadius:9, background:'rgba(141,198,63,0.12)', border:'1px solid rgba(141,198,63,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9FD340" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 17.5h7M17.5 14v7"/>
              </svg>
            </div>
            <h2>Procore</h2>
            {status === null
              ? <span className="badge badge-loading">{en ? 'Checking...' : 'Verificando...'}</span>
              : procoreOk
                ? <span className="badge badge-connected">CONNECTED</span>
                : <span className="badge badge-warn">{en ? 'Not Connected' : 'Sin conexión'}</span>}
          </div>

          <p className="desc">
            {en
              ? <>{`Import real projects, RFIs and Submittals from your Procore account. Click `}<strong>Connect with Procore</strong>{` and authorize JAXI — your real data will replace demo data immediately.`}</>
              : <>{`Importa proyectos, RFIs y Submittals reales desde tu cuenta de Procore. Haz click en `}<strong>Conectar con Procore</strong>{` y autoriza JAXI — tus datos reales reemplazarán los datos demo inmediatamente.`}</>}
          </p>

          {procoreOk ? (
            <>
              <div className="stat-row">
                <span className="stat-dot dot-green" />
                <span>{en ? 'Procore connected — syncing projects, RFIs and Submittals' : 'Procore conectado — sincronizando proyectos, RFIs y Submittals'}</span>
              </div>
              <div className="btn-row">
                <button className="btn-sync" onClick={syncProcore} disabled={syncingProcore}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  {syncingProcore ? (en ? 'Syncing...' : 'Sincronizando...') : (en ? 'Sync Now' : 'Sincronizar ahora')}
                </button>
                <button className="btn-disconnect" onClick={disconnectProcore}>
                  {en ? 'Disconnect' : 'Desconectar'}
                </button>
                <button className="btn-sync" onClick={connectProcore} style={{ marginLeft:4 }}>
                  {en ? 'Re-authorize' : 'Re-autorizar'}
                </button>
              </div>
            </>
          ) : (
            <button className="connect-btn btn-pc" onClick={connectProcore}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
              </svg>
              {en ? 'Connect with Procore' : 'Conectar con Procore'}
            </button>
          )}
        </div>

        {/* ── What happens when you connect ── */}
        <div className="card">
          <div className="card-head">
            <div style={{ width:38, height:38, borderRadius:9, background:'rgba(159,211,64,0.10)', border:'1px solid rgba(159,211,64,0.20)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9FD340" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </div>
            <h2>{en ? 'What happens when you connect?' : '¿Qué pasa cuando conectas?'}</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:8 }}>
            {steps.map((s) => (
              <div key={s.n} className="step-item">
                <div className="step-num">{s.n}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{s.t}</div>
                  <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding:40, color:'#a9a4cc' }}>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}