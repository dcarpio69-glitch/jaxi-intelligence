'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProjects, type ProjectItem } from '@/hooks/useApiData';

// ─── Static metadata to enrich demo data ────────────────
const PROJECT_META: Record<string, { city: string; state: string; stage: string; type: string; loc: string }> = {
  '6008': { city: 'South Miami',      state: 'FL', stage: 'Pre-Construction',      type: 'Mixed Use Apartments',    loc: 'South Miami, FL 33143' },
  '6000': { city: 'Fort Lauderdale',  state: 'FL', stage: 'Course of Construction', type: 'Multifamily Apartments',  loc: 'Fort Lauderdale, FL 33304' },
  '5996': { city: 'Miami',            state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Apartments',    loc: 'Miami, FL 33126' },
  '5935': { city: 'Miami',            state: 'FL', stage: 'Warranty',               type: 'Mixed Use Apartments',    loc: 'Miami, FL 33156' },
  '5981': { city: 'Coral Gables',     state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Condominium',   loc: 'Coral Gables, FL 33146' },
  '6002': { city: 'Miami',            state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Apartments',    loc: 'Miami, FL 33129' },
  '5998': { city: 'Miami',            state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Apartments',    loc: 'Miami, FL 33130' },
  '5992': { city: 'Miami',            state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Condominium',   loc: 'Miami, FL 33125' },
  '5957': { city: 'Pembroke Pines',   state: 'FL', stage: 'Warranty',               type: 'Mixed Use Apartments',    loc: 'Pembroke Pines, FL 33025' },
  '5999': { city: 'North Miami',      state: 'FL', stage: 'Course of Construction', type: 'Mixed Use Apartments',    loc: 'North Miami, FL 33161' },
};

const STAGE_COLOR: Record<string, { bg: string; color: string }> = {
  'Pre-Construction':      { bg: 'rgba(59,130,246,0.12)',  color: '#93C5FD' },
  'Course of Construction':{ bg: 'rgba(141,198,63,0.12)', color: '#8DC63F' },
  'Warranty':              { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF' },
  'Closeout':              { bg: 'rgba(16,185,129,0.12)', color: '#6EE7B7' },
};

// ─── Mini risk indicator ─────────────────────────────────
function RiskDot({ count, type }: { count: number; type: 'rfi' | 'sub' }) {
  if (count === 0) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>;
  const color = count >= 15 ? '#EF4444' : count >= 5 ? '#F59E0B' : '#6EE7B7';
  return (
    <span style={{ fontWeight: 700, fontSize: 14, color }}>
      {count}
    </span>
  );
}

// ─── Project card ────────────────────────────────────────
function ProjectCard({ project }: { project: ProjectItem }) {
  const meta    = PROJECT_META[project.id];
  const stage   = meta?.stage ?? 'Active';
  const loc     = meta?.loc ?? `${project.city ?? ''}, ${project.state ?? 'FL'}`.trim();
  const type    = meta?.type ?? 'Construction';
  const sColor  = STAGE_COLOR[stage] ?? STAGE_COLOR['Course of Construction'];
  const hasData = project.rfiCount > 0 || project.subCount > 0;
  const initials = project.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <Link
      href={`/dashboard?project=${project.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'all .2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(141,198,63,0.3)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLDivElement).style.transform = 'none';
        }}
      >
        {/* Accent line for active data */}
        {hasData && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 3, background: 'linear-gradient(90deg, #8DC63F, #4ade80)',
          }} />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: hasData ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${hasData ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
            color: hasData ? '#8DC63F' : 'rgba(255,255,255,0.3)',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8e6ff', margin: 0, lineHeight: 1.3 }}>
              {project.name}
            </h3>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              {project.code} · {loc}
            </div>
          </div>
        </div>

        {/* Stage + type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7,
            background: sColor.bg, color: sColor.color,
            border: `1px solid ${sColor.color}30`,
          }}>
            {stage}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{type}</span>
        </div>

        {/* Metrics */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10,
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              RFIs abiertos
            </div>
            <RiskDot count={project.rfiCount} type="rfi" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              Submittals
            </div>
            <RiskDot count={project.subCount} type="sub" />
          </div>
        </div>

        {/* Data status */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: hasData ? '#8DC63F' : 'rgba(255,255,255,0.25)',
          }}>
            {hasData ? '● Datos cargados' : '○ Sin datos aún'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.6)', fontWeight: 600 }}>
            Ver dashboard →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Summary banner ──────────────────────────────────────
function SummaryBanner({ projects }: { projects: ProjectItem[] }) {
  const totalRFIs = projects.reduce((sum, p) => sum + p.rfiCount, 0);
  const totalSubs = projects.reduce((sum, p) => sum + p.subCount, 0);
  const withData  = projects.filter(p => p.rfiCount > 0 || p.subCount > 0).length;

  if (totalRFIs === 0 && totalSubs === 0) return null;

  return (
    <div style={{
      background: 'rgba(141,198,63,0.06)',
      border: '1px solid rgba(141,198,63,0.2)',
      borderLeft: '3px solid #8DC63F',
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
    }}>
      <span style={{ fontSize: 18 }}>📊</span>
      <div>
        <span style={{ color: '#8DC63F', fontWeight: 700 }}>{withData} proyectos</span> con datos cargados ·{' '}
        <span style={{ color: '#FCA5A5', fontWeight: 700 }}>{totalRFIs} RFIs</span> abiertos ·{' '}
        <span style={{ color: '#FCD34D', fontWeight: 700 }}>{totalSubs} Submittals</span> activos en portafolio
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────
export default function ProjectsPage() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'data' | 'construction' | 'warranty'>('all');

  const { data, loading, isDemo, refresh } = useProjects();
  const projects = data?.projects ?? [];

  const filtered = useMemo(() => {
    let list = projects;
    if (filter === 'data')         list = list.filter(p => p.rfiCount > 0 || p.subCount > 0);
    if (filter === 'construction') list = list.filter(p => (PROJECT_META[p.id]?.stage ?? '').includes('Construction'));
    if (filter === 'warranty')     list = list.filter(p => PROJECT_META[p.id]?.stage === 'Warranty');
    if (search) list = list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (PROJECT_META[p.id]?.city ?? '').toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [projects, filter, search]);

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: 'var(--surface-bg, #16135e)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .filter-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.45); font-size:13px; font-weight:500; padding:8px 16px; border-radius:10px; cursor:pointer; transition:all .15s; font-family:inherit; }
        .filter-btn.active { background:rgba(141,198,63,0.12); border-color:rgba(141,198,63,0.4); color:#8DC63F; }
        .filter-btn:hover:not(.active) { border-color:rgba(255,255,255,0.15); color:rgba(255,255,255,0.7); }
        .jaxi-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e8e6ff; border-radius:10px; padding:8px 14px; font-size:13px; outline:none; font-family:inherit; transition:border .15s; }
        .jaxi-input:focus { border-color:rgba(141,198,63,0.5); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, animation: 'fade-in .4s ease' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e8e6ff', margin: 0 }}>Proyectos</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {loading ? 'Cargando...' : `${projects.length} proyectos activos en portafolio JAXI Builders`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isDemo && (
            <a href="/settings" style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              background: 'rgba(245,158,11,0.12)', color: '#FCD34D',
              border: '1px solid rgba(245,158,11,0.3)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>⚠ DEMO · Conectar</a>
          )}
          <button
            onClick={refresh}
            style={{
              background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)',
              color: '#8DC63F', fontSize: 12, fontWeight: 600, padding: '7px 14px',
              borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Summary banner */}
      {!loading && <SummaryBanner projects={projects} />}

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          className="jaxi-input"
          placeholder="🔍  Buscar proyecto, código o ciudad…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 240 }}
        />
        {[
          { key: 'all',          label: 'Todos' },
          { key: 'data',         label: 'Con datos' },
          { key: 'construction', label: 'En construcción' },
          { key: 'warranty',     label: 'Garantía' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key as typeof filter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Cargando proyectos…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏗</div>
          No hay proyectos con esos filtros
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          animation: 'fade-in .4s ease',
        }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          JAXI Intelligence · {projects.length} proyectos · BIMVDC CORE
          {isDemo && ' · Datos demo'}
        </div>
      )}
    </div>
  );
}
