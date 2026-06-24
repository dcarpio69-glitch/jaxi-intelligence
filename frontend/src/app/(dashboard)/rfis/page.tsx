'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';


const CSS = `
  :root {
    --navy:    #322A81;
    --accent:  #9FD340;
    --surface: #3A3392;
    --sur2:    #454099;
    --line:    #4C46A2;
    --txt:     #FFFFFF;
    --muted:   #C2BEE8;
    --faint:   #8E89C4;
    --danger-bg:#4A2740; --danger-tx:#FF8C8C;
    --ok-tx:   #9FD340; --warn-tx:#FFC24D;
    --info-bg: #2A2370; --info-tx:#CFCBF0;
    --r:14px; --rsm:9px;
  }
  .rfi-wrap { max-width:1200px; margin:0 auto; padding:28px 24px 60px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }

  /* ── Header ── */
  .rfi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:22px; flex-wrap:wrap; }
  .rfi-title  { font-size:28px; font-weight:800; color:var(--txt); margin:0 0 4px; }
  .rfi-sub    { font-size:13px; color:var(--muted); }
  .btn-new    { display:flex; align-items:center; gap:8px; background:var(--accent); color:var(--navy); border:none;
                font-weight:700; font-size:14px; padding:11px 20px; border-radius:10px; cursor:pointer;
                transition:filter .15s; white-space:nowrap; flex-shrink:0; }
  .btn-new:hover { filter:brightness(1.1); }

  /* ── KPI bar ── */
  .kpi-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
  .kpi-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--r); padding:16px 20px;
              transition:transform .15s, box-shadow .15s; cursor:default; }
  .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,.25); }
  .kpi-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
  .kpi-val   { font-size:32px; font-weight:800; line-height:1; }
  .kpi-note  { font-size:11px; color:var(--faint); margin-top:4px; }

  /* ── Layout ── */
  .rfi-grid { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
  @media(max-width:960px){ .rfi-grid{grid-template-columns:1fr;} }

  /* ── Filters ── */
  .filter-row { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .f-input { background:var(--surface); border:1px solid var(--line); color:var(--txt); border-radius:9px;
             padding:9px 14px; font-size:13px; min-width:220px; font-family:inherit; }
  .f-input:focus { outline:none; border-color:var(--accent); }
  .f-input::placeholder { color:var(--faint); }
  .fbtn { background:var(--surface); border:1px solid var(--line); color:var(--muted); font-size:13px;
          border-radius:9px; padding:9px 16px; cursor:pointer; transition:all .15s; font-family:inherit; }
  .fbtn:hover { color:var(--txt); border-color:var(--faint); }
  .fbtn.on { background:rgba(159,211,64,.12); color:var(--accent); border-color:rgba(159,211,64,.35); font-weight:600; }
  .sort-wrap { margin-left:auto; display:flex; align-items:center; gap:8px; }
  .sort-lbl { font-size:12px; color:var(--faint); white-space:nowrap; }
  .sort-sel { background:var(--surface); border:1px solid var(--line); color:var(--txt); border-radius:9px;
              padding:9px 12px; font-size:13px; cursor:pointer; font-family:inherit; }

  /* ── Table ── */
  .tbl-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--r); overflow:hidden; }
  table { width:100%; border-collapse:collapse; table-layout:auto; }
  thead th { font-size:11px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.06em;
             padding:12px 10px; text-align:left; background:var(--sur2); border-bottom:1px solid var(--line); white-space:nowrap; }
  th.th-num  { width:82px; }
  th.th-title{ min-width:200px; }
  th.th-disc { width:88px; }
  th.th-stat { width:90px; }
  th.th-due  { width:80px; }
  th.th-asn  { width:105px; }
  th.th-src  { width:90px; }
  th.th-risk { width:70px; }
  tbody tr { border-bottom:1px solid var(--line); transition:background .15s; cursor:pointer; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:rgba(255,255,255,.05); }
  tbody tr.row-hi { background:rgba(159,211,64,0.07) !important; }
  tbody td { padding:10px 10px; font-size:13px; color:var(--txt); vertical-align:middle; }

  /* ── Title cell — readable single line with ellipsis ── */
  .td-title {
    white-space:nowrap;
    overflow:hidden;
  }
  .td-title span {
    display:block;
    overflow:hidden;
    white-space:nowrap;
    text-overflow:ellipsis;
    font-weight:500;
    max-width:260px;
  }
  tbody tr:hover .td-title span { color:#fff; }

  /* ── Pill badges ── */
  .pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 9px;
          border-radius:7px; white-space:nowrap; }
  .pill-open  { background:rgba(37,99,235,.15); color:#93C5FD; border:1px solid rgba(37,99,235,.25); }
  .pill-rev   { background:rgba(245,158,11,.15); color:var(--warn-tx); border:1px solid rgba(245,158,11,.25); }
  .pill-done  { background:rgba(16,185,129,.15); color:#6EE7B7; border:1px solid rgba(16,185,129,.25); }
  .pill-closed{ background:rgba(100,116,139,.15); color:#94A3B8; border:1px solid rgba(100,116,139,.25); }
  .pill-ov    { background:var(--danger-bg); color:var(--danger-tx); border:1px solid rgba(255,140,140,.25); animation:pulseCrit 1.8s ease-in-out infinite; }

  /* ── Source badge ── */
  .src { font-size:10px; font-weight:600; padding:2px 7px; border-radius:5px; white-space:nowrap; }
  .src-ol { background:rgba(37,99,235,.12); color:#93C5FD; border:1px solid rgba(37,99,235,.2); }
  .src-p  { background:rgba(100,116,139,.08); color:var(--faint); border:1px solid var(--line); }

  /* ── Risk bar ── */
  .risk-wrap { display:flex; align-items:center; gap:8px; }
  .risk-track{ width:48px; height:6px; background:var(--sur2); border-radius:4px; overflow:hidden; flex-shrink:0; }
  .risk-fill { height:100%; border-radius:4px; transition:width .4s ease; }
  .risk-num  { font-size:12px; font-weight:800; min-width:24px; }

  /* ── Avatar ── */
  .av { width:24px; height:24px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center;
        font-size:9px; font-weight:800; color:#fff; flex-shrink:0; background:linear-gradient(135deg,#322A81,#9FD340); }

  /* ── Pager ── */
  .pager { display:flex; align-items:center; justify-content:space-between; padding:12px 16px;
           border-top:1px solid var(--line); font-size:12px; color:var(--muted); }
  .pager-btns { display:flex; gap:6px; }
  .pg { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:600; cursor:pointer; border:1px solid var(--line); background:none; color:var(--muted); transition:all .15s; }
  .pg.on { background:var(--accent); color:var(--navy); border-color:var(--accent); }
  .pg:hover:not(.on) { color:var(--txt); border-color:var(--faint); }
  .pg:disabled { opacity:.35; cursor:default; }

  /* ── RFI Detail Drawer ── */
  .drawer-overlay { position:fixed; inset:0; background:rgba(10,8,40,0.55); z-index:900;
                    backdrop-filter:blur(3px); animation:fadeIn .2s ease; }
  .drawer { position:fixed; top:0; right:0; bottom:0; width:min(480px,95vw); background:var(--surface);
             border-left:1px solid var(--line); z-index:901; overflow-y:auto;
             animation:slideIn .25s cubic-bezier(.22,.1,.36,1); padding:28px 26px 40px;
             display:flex; flex-direction:column; gap:0; }
  @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  .drawer-close { position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.07);
                  border:1px solid var(--line); color:var(--muted); border-radius:8px;
                  width:32px; height:32px; display:flex; align-items:center; justify-content:center;
                  cursor:pointer; font-size:16px; transition:all .15s; }
  .drawer-close:hover { background:rgba(255,80,80,.15); color:#FF8C8C; border-color:#FF8C8C55; }
  .drawer-num  { font-size:11px; font-weight:700; color:var(--accent); letter-spacing:.08em;
                 text-transform:uppercase; margin-bottom:6px; }
  .drawer-title{ font-size:20px; font-weight:800; color:var(--txt); margin:0 0 18px; line-height:1.3; }
  .drawer-sect { font-size:10px; font-weight:700; color:var(--faint); letter-spacing:.07em;
                 text-transform:uppercase; margin:18px 0 10px; border-bottom:1px solid var(--line); padding-bottom:6px; }
  .drawer-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 20px; }
  .d-field { display:flex; flex-direction:column; gap:3px; }
  .d-label { font-size:10px; color:var(--faint); text-transform:uppercase; letter-spacing:.05em; }
  .d-val   { font-size:13px; color:var(--txt); font-weight:500; }
  .drawer-desc { background:var(--sur2); border-radius:10px; padding:14px 16px; font-size:13px;
                 color:var(--muted); line-height:1.6; margin-top:6px; border:1px solid var(--line); }
  .drawer-actions { display:flex; gap:10px; margin-top:22px; }
  .d-btn { flex:1; padding:11px 0; border-radius:10px; font-size:13px; font-weight:700;
            cursor:pointer; border:none; transition:all .15s; }
  .d-btn-primary { background:var(--accent); color:var(--navy); }
  .d-btn-primary:hover { filter:brightness(1.08); }
  .d-btn-ghost  { background:rgba(255,255,255,0.06); color:var(--muted); border:1px solid var(--line); }
  .d-btn-ghost:hover { color:var(--txt); border-color:var(--faint); }

  /* ── Right panel ── */
  .panel-card { background:var(--surface); border:1px solid var(--line); border-radius:var(--r); padding:18px; margin-bottom:14px;
                transition:border-color .2s; }
  .panel-card:hover { border-color:rgba(159,211,64,0.2); }
  .panel-title { font-size:10px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; }

  /* ── Fix 3: Interactive chart transitions ── */
  .gauge-wrap { text-align:center; }
  .gauge-arc  { transition:stroke-dasharray .5s ease, stroke .4s ease; }
  .gauge-val  { transition:all .3s ease; }

  /* ── Donut (SVG) ── */
  .donut-row { display:flex; align-items:center; gap:14px; }
  .legend { display:flex; flex-direction:column; gap:8px; flex:1; }
  .leg-item { display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:12px; color:var(--muted);
              cursor:pointer; padding:3px 5px; border-radius:5px; transition:background .15s; }
  .leg-item:hover { background:rgba(255,255,255,0.05); color:var(--txt); }
  .leg-item.leg-hi { background:rgba(159,211,64,0.08); }
  .leg-dot { width:9px; height:9px; border-radius:3px; flex-shrink:0; }
  .leg-val { font-weight:700; color:var(--txt); }
  .donut-slice { transition:stroke-dasharray .45s ease, opacity .25s; cursor:pointer; }
  .donut-slice:hover { opacity:.85; }

  /* ── Hbar ── */
  .hbar-row { margin-bottom:12px; cursor:pointer; border-radius:6px; padding:3px 5px; transition:background .15s; }
  .hbar-row:hover { background:rgba(255,255,255,0.04); }
  .hbar-row.hbar-hi { background:rgba(159,211,64,0.07); }
  .hbar-top { display:flex; justify-content:space-between; font-size:12px; color:var(--muted); margin-bottom:5px; }
  .hbar-track { height:8px; background:var(--sur2); border-radius:5px; overflow:hidden; }
  .hbar-fill  { height:100%; border-radius:5px; transition:width .5s ease; }

  /* ── Summary stats ── */
  .stat-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line); }
  .stat-row:last-child { border-bottom:none; }
  .stat-lbl { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:6px; }
  .stat-val { font-size:16px; font-weight:800; }

  /* ── Animations ── */
  @keyframes pulseCrit { 0%,100%{box-shadow:0 0 0 0 rgba(255,140,140,.5)} 50%{box-shadow:0 0 0 5px rgba(255,140,140,0)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  tbody tr { animation:fadeIn .2s ease both; }
`;

const allRfis = [
  { id:'r1',  num:'RFI-042', title:'Especificaciones de concreto — Sección B',     titleEn:'Concrete Specifications — Section B',          status:'OPEN',     priority:'CRITICAL', disc:'Structural',   daysLeft:0,  assignee:'E. Martínez', riskScore:95, source:'PROCORE' },
  { id:'r2',  num:'RFI-021', title:'Altura libre — Nivel 4 Estacionamiento',        titleEn:'Clear Height — Level 4 Parking Garage',          status:'OVERDUE',  priority:'CRITICAL', disc:'Civil',        daysLeft:-3, assignee:'O. Cardenas', riskScore:92, source:'PROCORE' },
  { id:'r3',  num:'RFI-038', title:'Cambio estructural — Viga W12x40',              titleEn:'Structural Change — W12x40 Beam',                status:'PENDING',  priority:'HIGH',     disc:'Structural',   daysLeft:4,  assignee:'C. Reyes',    riskScore:70, source:'PROCORE+OUTLOOK' },
  { id:'r4',  num:'RFI-019', title:'Especificación de impermeabilización piscina', titleEn:'Pool Waterproofing Specification',                  status:'OPEN',     priority:'HIGH',     disc:'Civil',        daysLeft:2,  assignee:'A. Pérez',    riskScore:78, source:'PROCORE+OUTLOOK' },
  { id:'r5',  num:'RFI-035', title:'Coordinación MEP — Piso 8',                  titleEn:'MEP Coordination — Floor 8',                     status:'OPEN',     priority:'HIGH',     disc:'MEP',          daysLeft:6,  assignee:'A. Pérez',    riskScore:60, source:'PROCORE+OUTLOOK' },
  { id:'r6',  num:'RFI-031', title:'Detalles de acabado de fachada',               titleEn:'Facade Finish Details',                             status:'OPEN',     priority:'MEDIUM',   disc:'Architecture', daysLeft:10, assignee:'L. García',   riskScore:35, source:'PROCORE' },
  { id:'r7',  num:'RFI-028', title:'Especificación de impermeabilización',         titleEn:'Waterproofing Specification',                       status:'ANSWERED', priority:'MEDIUM',   disc:'Civil',        daysLeft:99, assignee:'M. Salazar',  riskScore:0,  source:'PROCORE+OUTLOOK' },
  { id:'r8',  num:'RFI-025', title:'Aclaración de plano — Escalera S2',           titleEn:'Drawing Clarification — Staircase S2',            status:'CLOSED',   priority:'LOW',      disc:'Architecture', daysLeft:99, assignee:'P. López',    riskScore:0,  source:'PROCORE' },
];

const pillStyle: Record<string, string> = {
  OPEN:'pill-open', PENDING:'pill-rev', ANSWERED:'pill-done', CLOSED:'pill-closed', OVERDUE:'pill-ov',
};
const priorityColor: Record<string, string> = {
  CRITICAL:'#EF4444', HIGH:'#F59E0B', MEDIUM:'#3B82F6', LOW:'#6B7280',
};
const riskColor = (s: number) => s >= 80 ? '#FF8C8C' : s >= 50 ? '#FFC24D' : '#9FD340';


function Gauge({ score, avgRiskLabel, lowLabel, midLabel, critLabel }: {
  score: number; avgRiskLabel: string; lowLabel: string; midLabel: string; critLabel: string;
}) {
  // Semicircle gauge: radius 56, center (84, 80), viewBox 168x96 with 8px padding
  const r = 56, cx = 84, cy = 82;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const arc = Math.PI;
  const filled = pct * arc;
  // End point of the colored arc
  const x2 = cx + r * Math.cos(Math.PI + filled);
  const y2 = cy + r * Math.sin(Math.PI + filled);
  const needleLarge = filled > Math.PI / 2 ? 1 : 0;
  const col = score >= 80 ? '#FF8C8C' : score >= 50 ? '#FFC24D' : '#9FD340';
  const glow = score >= 80 ? 'rgba(255,140,140,0.5)' : score >= 50 ? 'rgba(255,194,77,0.5)' : 'rgba(159,211,64,0.5)';
  return (
    <div className="gauge-wrap">
      <svg width="168" height="96" viewBox="0 0 168 96" style={{ overflow:'visible' }}>
        <defs>
          <filter id="glow-g">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round"
        />
        {/* Inner track ring */}
        <path
          d={`M ${cx-r+8} ${cy} A ${r-8} ${r-8} 0 0 1 ${cx+r-8} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" strokeLinecap="round"
        />
        {/* Filled arc */}
        {score > 0 && (
          <path
            className="gauge-arc"
            d={`M ${cx-r} ${cy} A ${r} ${r} 0 ${needleLarge} 1 ${x2} ${y2}`}
            fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
            filter="url(#glow-g)"
            style={{ transition:'d .5s ease, stroke .4s ease' }}
          />
        )}
        {/* Score */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill="white" fontSize="30" fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
        <text x={cx} y={cy - 1} textAnchor="middle" fill={col} fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif" letterSpacing=".06em">
          {score >= 80 ? '\u25b2 ' : score >= 50 ? '\u25b6 ' : '\u25bc '}{avgRiskLabel.toUpperCase()}
        </text>
      </svg>
      {/* Scale labels */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 4px', fontSize:9, color:'rgba(255,255,255,0.22)', marginTop:-4 }}>
        <span>0 {lowLabel}</span><span>50</span><span>100 {critLabel}</span>
      </div>
    </div>
  );
}

// ── Fix 3: Interactive Donut — hover on legend highlights slice ───────────────
function Donut({ data, onHover }: {
  data: { label: string; value: number; color: string; filterKey: string }[];
  onHover: (key: string | null) => void;
}) {
  const [hovSlice, setHovSlice] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 42, cx = 52, cy = 52, sw = 16;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const slices = data.map(d => {
    const dash = total > 0 ? (d.value / total) * circ : 0;
    const s = { ...d, dash, gap: circ - dash, off };
    off += dash;
    return s;
  });
  return (
    <div className="donut-row">
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
        {slices.map((s, i) => (
          <circle key={i} className="donut-slice" cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={hovSlice === s.filterKey ? sw + 4 : sw}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.off}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={hovSlice && hovSlice !== s.filterKey ? 0.35 : 1}
            style={{ filter: hovSlice === s.filterKey ? `drop-shadow(0 0 6px ${s.color}88)` : 'none' }}
            onMouseEnter={() => { setHovSlice(s.filterKey); onHover(s.filterKey); }}
            onMouseLeave={() => { setHovSlice(null); onHover(null); }}
          />
        ))}
        <text x={cx} y={cy-6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{total}</text>
        <text x={cx} y={cy+9} textAnchor="middle" fill="#8E89C4" fontSize="8">RFIs</text>
      </svg>
      <div className="legend">
        {data.map((d, i) => (
          <div key={i} className={`leg-item ${hovSlice === d.filterKey ? 'leg-hi' : ''}`}
            onMouseEnter={() => { setHovSlice(d.filterKey); onHover(d.filterKey); }}
            onMouseLeave={() => { setHovSlice(null); onHover(null); }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div className="leg-dot" style={{ background:d.color }}/>
              <span>{d.label}</span>
            </div>
            <span className="leg-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RFIsPage() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [hoveredRfi, setHoveredRfi] = useState<typeof allRfis[0] | null>(null);
  const [chartFilter, setChartFilter] = useState<string | null>(null);
  const [selectedRfi, setSelectedRfi] = useState<typeof allRfis[0] | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const pillLabel: Record<string, string> = {
    OPEN:    t('status.open'),
    PENDING: t('status.pending'),
    ANSWERED:t('status.answered'),
    CLOSED:  t('status.closed'),
    OVERDUE: t('status.overdue'),
  };

  const dueLabel = (daysLeft: number, status: string): string => {
    if (status === 'ANSWERED') return t('status.answered');
    if (status === 'CLOSED')   return t('status.closed');
    if (daysLeft === 0)        return lang === 'en' ? 'Today' : 'Hoy';
    if (daysLeft < 0)          return lang === 'en' ? `Overdue ${Math.abs(daysLeft)}d` : `Vencido ${Math.abs(daysLeft)}d`;
    return lang === 'en' ? `In ${daysLeft} days` : `En ${daysLeft} días`;
  };

  const filters = [
    { key:'all',      label: t('filter.all') },
    { key:'open',     label: t('filter.open') },
    { key:'critical', label: t('filter.critical') },
    { key:'overdue',  label: t('filter.overdue') },
    { key:'resolved', label: t('filter.resolved') },
  ];

  // Main table filter
  const filtered = allRfis.filter(r => {
    const matchSearch = !search || r.num.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'open'     ? r.status === 'OPEN' :
      filter === 'critical' ? r.priority === 'CRITICAL' :
      filter === 'overdue'  ? (r.status === 'OVERDUE' || r.daysLeft <= 0) :
      filter === 'resolved' ? (r.status === 'ANSWERED' || r.status === 'CLOSED') : true;
    return matchSearch && matchFilter;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Reset to page 1 when filter/search changes
  const handleFilterChange = (key: string) => { setFilter(key); setPage(1); };
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  // Build visible page numbers
  const pageNums: (number|string)[] = [];
  if (totalPages <= 6) { for (let i=1;i<=totalPages;i++) pageNums.push(i); }
  else {
    pageNums.push(1);
    if (page > 3) pageNums.push('…');
    for (let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pageNums.push(i);
    if (page < totalPages-2) pageNums.push('…');
    pageNums.push(totalPages);
  }

  // ── Fix 3: Chart data reacts to filtered list (not hardcoded) ─────────────
  const chartData = filtered; // charts always reflect current filter
  const activeRFIs  = chartData.filter(r => r.riskScore > 0);
  const gaugeScore  = hoveredRfi
    ? hoveredRfi.riskScore
    : activeRFIs.length > 0
      ? Math.round(activeRFIs.reduce((a, r) => a + r.riskScore, 0) / activeRFIs.length)
      : 0;

  const donutData = [
    { label:t('priority.critical'), value:chartData.filter(r=>r.priority==='CRITICAL').length, color:'#FF8C8C', filterKey:'critical' },
    { label:t('priority.high'),     value:chartData.filter(r=>r.priority==='HIGH').length,     color:'#FFC24D', filterKey:'high' },
    { label:t('priority.medium'),   value:chartData.filter(r=>r.priority==='MEDIUM').length,   color:'#3B82F6', filterKey:'medium' },
    { label:t('priority.low'),      value:chartData.filter(r=>r.priority==='LOW').length,       color:'#6B7280', filterKey:'low' },
  ];

  const discData = [
    { label:'Structural',   value:chartData.filter(r=>r.disc==='Structural').length,   color:'#8B5CF6', key:'Structural' },
    { label:'Architecture', value:chartData.filter(r=>r.disc==='Architecture').length, color:'#3B82F6', key:'Architecture' },
    { label:'MEP',          value:chartData.filter(r=>r.disc==='MEP').length,          color:'#10B981', key:'MEP' },
    { label:'Civil',        value:chartData.filter(r=>r.disc==='Civil').length,        color:'#FFC24D', key:'Civil' },
  ];
  const discMax = Math.max(...discData.map(d => d.value), 1);

  // When donut hover triggers a priority filter on the chart
  const handleDonutHover = (key: string | null) => setChartFilter(key);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rfi-wrap">

        {/* Header */}
        <div className="rfi-header">
          <div>
            <h1 className="rfi-title">{t('rfis.title')}</h1>
            <p className="rfi-sub">47 {t('filter.open').toLowerCase()} · 8 {t('kpi.overdue').toLowerCase()} · The Edge at Sunset</p>
          </div>
          <button id="btn-new-rfi" className="btn-new">{t('rfis.newBtn')}</button>
        </div>

        {/* KPI bar */}
        <div className="kpi-bar">
          {([
            { label:t('kpi.open'),    val:18, color:'#93C5FD', note:t('kpi.open.note') },
            { label:t('kpi.overdue'), val:8,  color:'#FF8C8C', note:t('kpi.overdue.note') },
            { label:t('kpi.court'),   val:5,  color:'#FFC24D', note:t('kpi.court.note') },
            { label:t('kpi.soon'),    val:3,  color:'#9FD340', note:t('kpi.soon.note') },
          ] as {label:string;val:number;color:string;note:string}[]).map((k,i) => (
            <div key={i} className="kpi-card" style={{ borderLeft:`3px solid ${k.color}55` }}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-val" style={{ color:k.color }}>{k.val}</div>
              <div className="kpi-note">{k.note}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="rfi-grid">

          {/* Table col */}
          <div>
            {/* Filters */}
            <div className="filter-row">
              <input
                id="rfi-search"
                className="f-input"
                placeholder={t('rfis.search')}
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
              {filters.map(f => (
                <button key={f.key} id={`filter-${f.key}`}
                  className={`fbtn ${filter===f.key?'on':''}`}
                  onClick={() => handleFilterChange(f.key)}>{f.label}</button>
              ))}
              <div className="sort-wrap">
                <span className="sort-lbl">{t('rfis.sortLabel')}</span>
                <select id="rfi-sort" className="sort-sel">
                  <option>{t('rfis.sort.risk')}</option>
                  <option>{t('rfis.sort.due')}</option>
                  <option>{t('rfis.sort.num')}</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="tbl-card">
              <table>
                <thead>
                  <tr>
                    <th className="th-num">{t('col.number')}</th>
                    <th className="th-title">{t('col.title')}</th>
                    <th className="th-disc">{t('col.discipline')}</th>
                    <th className="th-stat">{t('col.status')}</th>
                    <th className="th-due">{t('col.due')}</th>
                    <th className="th-asn">{t('col.assigned')}</th>
                    <th className="th-src">{t('col.source')}</th>
                    <th className="th-risk">{t('col.risk')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(rfi => {
                    const isHi = chartFilter
                      ? rfi.priority.toLowerCase() === chartFilter
                      : false;
                    return (
                      <tr key={rfi.id} id={rfi.id}
                        className={isHi ? 'row-hi' : ''}
                        onMouseEnter={() => setHoveredRfi(rfi)}
                        onMouseLeave={() => setHoveredRfi(null)}
                        onClick={() => setSelectedRfi(rfi)}
                        style={{ cursor:'pointer' }}
                      >
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:priorityColor[rfi.priority], flexShrink:0 }}/>
                            <span style={{ fontWeight:700, fontSize:13 }}>{rfi.num}</span>
                          </div>
                        </td>
                        {/* Fix 2: truncated title with full text as tooltip */}
                        <td className="td-title" title={lang === 'en' ? rfi.titleEn : rfi.title}>
                          <span>{lang === 'en' ? rfi.titleEn : rfi.title}</span>
                        </td>
                        <td>
                          <span style={{ fontSize:12, color:'var(--muted)' }}>{rfi.disc}</span>
                        </td>
                        <td>
                          <span className={`pill ${pillStyle[rfi.status]}`}>{pillLabel[rfi.status]}</span>
                        </td>
                        <td>
                          <span style={{ fontSize:13, fontWeight:500, color:
                            rfi.daysLeft <= 0 ? '#FF8C8C' :
                            rfi.daysLeft <= 4 ? '#FFC24D' : 'var(--muted)'
                          }}>{dueLabel(rfi.daysLeft, rfi.status)}</span>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <span className="av">{rfi.assignee[0]}</span>
                            <span style={{ fontSize:12, color:'var(--muted)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{rfi.assignee}</span>
                          </div>
                        </td>
                        <td>
                          {rfi.source === 'PROCORE+OUTLOOK' ? (
                            <div style={{ display:'flex', gap:4 }}>
                              <span className="src src-p" title="Procore">PC</span>
                              <span className="src src-ol" title="Outlook">OL</span>
                            </div>
                          ) : (
                            <span className={`src ${rfi.source.includes('OUTLOOK')?'src-ol':'src-p'}`}>
                              {rfi.source === 'PROCORE' ? 'PC' : rfi.source}
                            </span>
                          )}
                        </td>
                        <td>
                          {rfi.riskScore > 0 ? (
                            <div className="risk-wrap">
                              <div className="risk-track">
                                <div className="risk-fill" style={{
                                  width:`${rfi.riskScore}%`,
                                  background:riskColor(rfi.riskScore),
                                  boxShadow:`0 0 4px ${riskColor(rfi.riskScore)}88`,
                                }}/>
                              </div>
                              <span className="risk-num" style={{ color:riskColor(rfi.riskScore) }}>{rfi.riskScore}</span>
                            </div>
                          ) : <span style={{ color:'var(--faint)', fontSize:12 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pager */}
              <div className="pager">
                <span>
                  {hoveredRfi
                    ? <span style={{ color:'var(--accent)', fontWeight:600 }}>📌 {hoveredRfi.num} · Risk {hoveredRfi.riskScore}</span>
                    : <span>{t('rfis.showing', String(paginated.length), String(filtered.length))}</span>
                  }
                </span>
                <div className="pager-btns">
                  {pageNums.map((p, i) => (
                    <button
                      key={i}
                      id={`page-${p}-${i}`}
                      className={`pg ${p===page?'on':''}`}
                      disabled={p === '…'}
                      onClick={() => typeof p === 'number' && setPage(p)}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — Fix 3: fully reactive charts */}
          <div>

            {/* Gauge — shows hovered row's risk, else avg of filtered */}
            <div className="panel-card">
              <div className="panel-title">
                {hoveredRfi
                  ? `${hoveredRfi.num} — ${t('col.risk')}`
                  : t('panel.riskIndex')
                }
              </div>
              <Gauge score={gaugeScore}
                avgRiskLabel={hoveredRfi ? hoveredRfi.num : t('common.riskAvg')}
                lowLabel={t('priority.low')}
                midLabel={t('priority.medium')}
                critLabel={t('priority.critical')}
              />
            </div>

            {/* Donut — reacts to filtered data + hover highlights rows */}
            <div className="panel-card">
              <div className="panel-title">
                {t('panel.byPriority')}
                {filter !== 'all' && (
                  <span style={{ marginLeft:6, color:'var(--accent)', fontWeight:600 }}>
                    ({filtered.length})
                  </span>
                )}
              </div>
              <Donut data={donutData} onHover={handleDonutHover} />
            </div>

            {/* Horizontal bars — discipline, reactive to filter */}
            <div className="panel-card">
              <div className="panel-title">{t('panel.byDisc')}</div>
              {discData.map((b, i) => {
                const isHiDisc = hoveredRfi?.disc === b.key;
                return (
                  <div key={i} className={`hbar-row ${isHiDisc ? 'hbar-hi' : ''}`}
                    title={`${b.label}: ${b.value} RFI${b.value !== 1 ? 's' : ''}`}>
                    <div className="hbar-top">
                      <span style={{ color: isHiDisc ? 'var(--txt)' : undefined }}>{b.label}</span>
                      <span style={{ fontWeight:700, color: isHiDisc ? b.color : 'var(--txt)' }}>{b.value}</span>
                    </div>
                    <div className="hbar-track">
                      <div className="hbar-fill" style={{
                        width:`${(b.value/discMax)*100}%`,
                        background: isHiDisc
                          ? `linear-gradient(90deg,${b.color},${b.color}cc)`
                          : b.color,
                        boxShadow: isHiDisc ? `0 0 8px ${b.color}88` : `0 0 5px ${b.color}44`,
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick stats — reactive */}
            <div className="panel-card">
              <div className="panel-title">{t('panel.summary')}</div>
              {[
                { label:t('panel.withEmail'), val:filtered.filter(r=>r.source.includes('OUTLOOK')).length, color:'#93C5FD', icon:'📧' },
                { label:t('panel.dueToday'), val:filtered.filter(r=>r.daysLeft<=0&&r.riskScore>0).length, color:'#FF8C8C', icon:'🔴' },
                { label:t('panel.due5'),     val:filtered.filter(r=>r.daysLeft>0&&r.daysLeft<=5).length,  color:'#FFC24D', icon:'⚠️' },
                { label:t('panel.unassigned'),val:2, color:'#8E89C4', icon:'👤' },
              ].map((s,i) => (
                <div key={i} className="stat-row">
                  <span className="stat-lbl"><span>{s.icon}</span>{s.label}</span>
                  <span className="stat-val" style={{ color:s.color }}>{s.val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
      {selectedRfi && (
        <RFIDrawer
          rfi={selectedRfi}
          onClose={() => setSelectedRfi(null)}
          pillLabel={pillLabel}
          pillStyle={pillStyle}
          dueLabel={dueLabel}
          riskColor={riskColor}
          lang={lang}
        />
      )}
    </>
  );
}

// ── RFI Detail Drawer ──────────────────────────────────────────────────────────
function RFIDrawer({ rfi, onClose, pillLabel, pillStyle, dueLabel, riskColor, lang }: {
  rfi: any; onClose: () => void;
  pillLabel: Record<string,string>; pillStyle: Record<string,string>;
  dueLabel: (d:number,s:string)=>string; riskColor:(s:number)=>string; lang:string;
}) {
  const col = riskColor(rfi.riskScore);
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="drawer-close" onClick={onClose} title="Cerrar">✕</button>

        {/* Header */}
        <div className="drawer-num">{rfi.num}</div>
        <h2 className="drawer-title">{lang==='en'?rfi.titleEn:rfi.title}</h2>

        {/* Status + priority row */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
          <span className={`pill ${pillStyle[rfi.status]}`}>{pillLabel[rfi.status]}</span>
          <span className="pill" style={{ background:'rgba(255,255,255,.06)', color:'var(--muted)', border:'1px solid var(--line)' }}>
            {rfi.priority}
          </span>
        </div>

        <div className="drawer-sect">Detalles</div>
        <div className="drawer-grid">
          <div className="d-field">
            <span className="d-label">Disciplina</span>
            <span className="d-val">{rfi.disc}</span>
          </div>
          <div className="d-field">
            <span className="d-label">Vencimiento</span>
            <span className="d-val" style={{ color: rfi.daysLeft<=0?'#FF8C8C':rfi.daysLeft<=4?'#FFC24D':'var(--txt)' }}>
              {dueLabel(rfi.daysLeft, rfi.status)}
            </span>
          </div>
          <div className="d-field">
            <span className="d-label">Asignado a</span>
            <span className="d-val">{rfi.assignee}</span>
          </div>
          <div className="d-field">
            <span className="d-label">Fuente</span>
            <span className="d-val">{rfi.source}</span>
          </div>
        </div>

        {/* Risk score visual */}
        <div className="drawer-sect">Índice de Riesgo</div>
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'6px 0' }}>
          <div style={{ flex:1, height:10, background:'rgba(255,255,255,0.07)', borderRadius:6, overflow:'hidden' }}>
            <div style={{ width:`${rfi.riskScore}%`, height:'100%', background:col,
              borderRadius:6, boxShadow:`0 0 8px ${col}88`, transition:'width .5s' }} />
          </div>
          <span style={{ fontSize:22, fontWeight:800, color:col, minWidth:36 }}>{rfi.riskScore}</span>
        </div>

        {/* Description */}
        <div className="drawer-sect">Descripción</div>
        <div className="drawer-desc">
          {lang === 'en'
            ? `Detailed review required for ${rfi.titleEn}. This item has been flagged for ${rfi.priority.toLowerCase()} priority attention. Coordination with the ${rfi.disc} team is required before proceeding.`
            : `Se requiere revisión detallada para ${rfi.title}. Este ítem ha sido marcado con prioridad ${rfi.priority.toLowerCase()}. Se necesita coordinación con el equipo de ${rfi.disc} antes de proceder.`
          }
        </div>

        {/* Actions */}
        <div className="drawer-actions">
          <button className="d-btn d-btn-primary">✏️ Editar RFI</button>
          <button className="d-btn d-btn-ghost">📋 Copiar enlace</button>
        </div>
      </div>
    </>
  );
}
