'use client';

import { useState, useMemo } from 'react';
import { useSubmittals, useProjects, type SubmittalItem } from '@/hooks/useApiData';

// ─── Status config ───────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  DRAFT:      'Borrador',
  SUBMITTED:  'Enviado',
  IN_REVIEW:  'En revisión',
  APPROVED:   'Aprobado',
  REJECTED:   'Rechazado',
  OVERDUE:    'Vencido',
  REVISE:     'Revisar',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:      { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF', border: 'rgba(107,114,128,0.25)' },
  SUBMITTED:  { bg: 'rgba(59,130,246,0.12)',  color: '#93C5FD', border: 'rgba(59,130,246,0.25)' },
  IN_REVIEW:  { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  APPROVED:   { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7', border: 'rgba(16,185,129,0.25)' },
  REJECTED:   { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.25)' },
  OVERDUE:    { bg: 'rgba(239,68,68,0.12)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.25)' },
  REVISE:     { bg: 'rgba(249,115,22,0.12)', color: '#FDBA74', border: 'rgba(249,115,22,0.25)' },
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH:     '#F59E0B',
  MEDIUM:   '#3B82F6',
  LOW:      '#6B7280',
};

// ─── Risk bar ────────────────────────────────────────────
function RiskBar({ score }: { score: number }) {
  if (!score) return <span style={{ color: 'var(--text-muted, #6b65a0)', fontSize: 12 }}>—</span>;
  const color = score >= 80 ? '#EF4444' : score >= 50 ? '#F59E0B' : '#10B981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 48, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width .5s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: score >= 80 ? '#FCA5A5' : score >= 50 ? '#FCD34D' : '#6EE7B7' }}>
        {score}
      </span>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Overdue pill ────────────────────────────────────────
function OverduePill({ days }: { days: number }) {
  if (days <= 0) return null;
  const sev = days >= 90 ? 'sev' : days >= 14 ? 'mid' : '';
  const color = days >= 90 ? '#EF4444' : days >= 14 ? '#F59E0B' : '#9CA3AF';
  const bg    = days >= 90 ? 'rgba(239,68,68,0.15)' : days >= 14 ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.1)';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: bg, color, border: `1px solid ${color}30`,
      animation: sev === 'sev' ? 'pulse-crit 1.8s ease-in-out infinite' : undefined,
    }}>
      {days}d
    </span>
  );
}

// ─── KPI Card ────────────────────────────────────────────
function KPICard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 20px',
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? '#fff', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Expandable row ──────────────────────────────────────
function SubmittalRow({ s }: { s: SubmittalItem }) {
  const [open, setOpen] = useState(false);

  const bicCompany = s.ballInCourt?.includes('JAXI') ? 'JAXI'
    : s.ballInCourt?.includes('Owner') || s.ballInCourt?.includes('Ingrid') ? 'Owner'
    : s.ballInCourt?.includes('MSA')   || s.ballInCourt?.includes('Betty')  ? 'MSA'
    : 'Ext';

  const companyColor: Record<string, string> = {
    JAXI: '#FCA5A5', Owner: '#FCD34D', MSA: '#93C5FD', Ext: '#A5B4FC',
  };

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: 'pointer',
          background: open ? 'rgba(255,255,255,0.03)' : undefined,
          transition: 'background .15s',
        }}
      >
        {/* Number */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: PRIORITY_COLOR[s.priority ?? 'MEDIUM'] ?? '#6B7280',
            }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#e8e6ff', fontFamily: 'JetBrains Mono, monospace' }}>
              {s.procoreNum ?? s.number}
            </span>
          </div>
        </td>

        {/* Title */}
        <td style={{ maxWidth: 280 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#e8e6ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.title}
          </p>
          {s.specSection && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.specSection}</p>
          )}
        </td>

        {/* Status */}
        <td><StatusBadge status={s.status} /></td>

        {/* Overdue */}
        <td><OverduePill days={s.daysOverdue} /></td>

        {/* Contractor */}
        <td>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {s.contractor ?? '—'}
          </span>
        </td>

        {/* Ball in court */}
        <td>
          {s.ballInCourt ? (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
              background: `${companyColor[bicCompany]}18`,
              color: companyColor[bicCompany],
              border: `1px solid ${companyColor[bicCompany]}30`,
            }}>
              {bicCompany}
            </span>
          ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
        </td>

        {/* Risk */}
        <td><RiskBar score={s.riskScore} /></td>

        {/* Expand */}
        <td>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        </td>
      </tr>

      {/* Detail row */}
      {open && (
        <tr>
          <td colSpan={8} style={{ padding: '0 0 12px 24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px 24px',
            }}>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Estado: </span>
                <span style={{ color: '#e8e6ff' }}>{STATUS_LABELS[s.status] ?? s.status}</span>
              </div>
              {s.dueDate && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Vencimiento: </span>
                  <span style={{ color: '#e8e6ff' }}>{new Date(s.dueDate).toLocaleDateString('es-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {s.contractor && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Contratista: </span>
                  <span style={{ color: '#e8e6ff' }}>{s.contractor}</span>
                </div>
              )}
              {s.ballInCourt && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Ball in court: </span>
                  <span style={{ color: '#e8e6ff' }}>{s.ballInCourt}</span>
                </div>
              )}
              {s.specSection && (
                <div style={{ fontSize: 12, gridColumn: '1 / -1' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Especificación: </span>
                  <span style={{ color: '#e8e6ff' }}>{s.specSection}</span>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', marginTop: 8, display: 'flex', gap: 8 }}>
                <a href="#" style={{
                  fontSize: 11, color: 'rgba(168,214,26,0.7)', border: '1px dashed rgba(168,214,26,0.25)',
                  borderRadius: 6, padding: '3px 9px', textDecoration: 'none',
                }}>
                  Abrir en Procore (Fase B) →
                </a>
                <a href="#" style={{
                  fontSize: 11, color: 'rgba(147,197,253,0.6)', border: '1px dashed rgba(147,197,253,0.2)',
                  borderRadius: 6, padding: '3px 9px', textDecoration: 'none',
                }}>
                  Ver emails Outlook (Fase B) →
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main page ───────────────────────────────────────────
export default function SubmittalsPage() {
  const [projId, setProjId]   = useState('6008');
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'overdue' | 'in_review' | 'draft'>('all');
  const [sortBy, setSortBy]   = useState<'risk' | 'overdue' | 'number'>('risk');

  const { data: projData }                   = useProjects();
  const { data, loading, isDemo, refresh }   = useSubmittals(projId);

  const submittals = data?.submittals ?? [];

  // Derived KPIs
  const kpis = useMemo(() => ({
    total:     submittals.length,
    overdue:   submittals.filter(s => s.daysOverdue > 0).length,
    inReview:  submittals.filter(s => s.status === 'IN_REVIEW' || s.status === 'SUBMITTED').length,
    draft:     submittals.filter(s => s.status === 'DRAFT').length,
    approved:  submittals.filter(s => s.status === 'APPROVED').length,
  }), [submittals]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = submittals;
    if (filter === 'overdue')   list = list.filter(s => s.daysOverdue > 0);
    if (filter === 'in_review') list = list.filter(s => s.status === 'IN_REVIEW' || s.status === 'SUBMITTED');
    if (filter === 'draft')     list = list.filter(s => s.status === 'DRAFT');
    if (search) list = list.filter(s =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      String(s.procoreNum ?? s.number).toLowerCase().includes(search.toLowerCase()) ||
      (s.contractor ?? '').toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === 'risk')    list = [...list].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
    if (sortBy === 'overdue') list = [...list].sort((a, b) => b.daysOverdue - a.daysOverdue);
    if (sortBy === 'number')  list = [...list].sort((a, b) => String(a.procoreNum ?? a.number).localeCompare(String(b.procoreNum ?? b.number)));
    return list;
  }, [submittals, filter, search, sortBy]);

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: 'var(--surface-bg, #16135e)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes pulse-crit { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 50%{box-shadow:0 0 0 5px rgba(239,68,68,0)} }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .sub-table { width:100%; border-collapse:collapse; }
        .sub-table thead tr { border-bottom:1px solid rgba(255,255,255,0.07); }
        .sub-table th { text-align:left; padding:10px 14px; font-size:11px; font-weight:600; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:.06em; }
        .sub-table td { padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04); }
        .sub-table tbody tr:hover td { background:rgba(255,255,255,0.02); }
        .filter-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.45); font-size:13px; font-weight:500; padding:8px 16px; border-radius:10px; cursor:pointer; transition:all .15s; }
        .filter-btn.active { background:rgba(141,198,63,0.12); border-color:rgba(141,198,63,0.4); color:#8DC63F; }
        .filter-btn:hover:not(.active) { border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.7); }
        .jaxi-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e8e6ff; border-radius:10px; padding:8px 14px; font-size:13px; outline:none; font-family:inherit; transition:border .15s; }
        .jaxi-input:focus { border-color:rgba(141,198,63,0.5); }
        .jaxi-select { background:rgba(15,13,58,0.9); border:1px solid rgba(255,255,255,0.1); color:#e8e6ff; border-radius:10px; padding:8px 14px; font-size:13px; outline:none; font-family:inherit; cursor:pointer; }
        .refresh-btn { background:rgba(141,198,63,0.1); border:1px solid rgba(141,198,63,0.25); color:#8DC63F; font-size:12px; font-weight:600; padding:7px 14px; border-radius:10px; cursor:pointer; transition:all .15s; }
        .refresh-btn:hover { background:rgba(141,198,63,0.2); }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, animation: 'fade-in .4s ease' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e8e6ff', margin: 0 }}>Submittals</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {loading ? 'Cargando...' : `${kpis.total} submittals · ${kpis.overdue} vencidos · ordenados por riesgo`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Demo badge */}
          {isDemo && (
            <a href="/settings" style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              background: 'rgba(245,158,11,0.12)', color: '#FCD34D',
              border: '1px solid rgba(245,158,11,0.3)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              ⚠ DEMO · Conectar
            </a>
          )}
          <button className="refresh-btn" onClick={refresh}>↻ Actualizar</button>
        </div>
      </div>

      {/* ─── Project selector ─── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 22 }}>🏗</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
            Proyecto
          </div>
          <select
            className="jaxi-select"
            value={projId}
            onChange={e => setProjId(e.target.value)}
            style={{ width: '100%', maxWidth: 420 }}
          >
            {(projData?.projects ?? []).map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) {p.rfiCount > 0 || p.subCount > 0 ? '— datos cargados' : ''}
              </option>
            ))}
            {!projData?.projects?.length && (
              <option value="6008">The Edge at Sunset (06008) — datos cargados</option>
            )}
          </select>
        </div>
      </div>

      {/* ─── KPI Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KPICard label="Total"      value={loading ? '…' : kpis.total}    />
        <KPICard label="En revisión" value={loading ? '…' : kpis.inReview} />
        <KPICard label="Borradores"  value={loading ? '…' : kpis.draft}   />
        <KPICard label="Vencidos"    value={loading ? '…' : kpis.overdue}  accent={kpis.overdue > 0 ? '#FCA5A5' : undefined} />
        <KPICard label="Aprobados"   value={loading ? '…' : kpis.approved} accent="#6EE7B7" />
      </div>

      {/* ─── Filters ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <input
          className="jaxi-input"
          placeholder="🔍  Buscar número, título o contratista…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        {[
          { key: 'all',       label: 'Todos' },
          { key: 'overdue',   label: `Vencidos${kpis.overdue ? ` (${kpis.overdue})` : ''}` },
          { key: 'in_review', label: 'En revisión' },
          { key: 'draft',     label: 'Borradores' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key as typeof filter)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Ordenar:</span>
          <select className="jaxi-select" style={{ fontSize: 12, padding: '6px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            <option value="risk">Riesgo (mayor)</option>
            <option value="overdue">Días vencido</option>
            <option value="number">Número</option>
          </select>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            Cargando submittals…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
            No hay submittals con estos filtros
          </div>
        ) : (
          <table className="sub-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Vencido</th>
                <th>Contratista</th>
                <th>Ball in Court</th>
                <th>Riesgo</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => <SubmittalRow key={s.id} s={s} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Footer ─── */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
          Mostrando {filtered.length} de {kpis.total} submittals
          {isDemo && ' · Datos demo — conecta Procore para datos en vivo'}
        </div>
      )}
    </div>
  );
}
