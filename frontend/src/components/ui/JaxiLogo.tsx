// JAXI BUILDERS, INC. — Official Logo Component
// Matches real logo: 4 equal lime-green squares + JAXI / BUILDERS, INC.
// Color reference: lime #8DC63F, navy bg #2D2B8F

interface JaxiLogoProps {
  /** sm = sidebar, md = topbar, lg = login page */
  size?: 'sm' | 'md' | 'lg';
  /** Show full logo with background rectangle (true) or just icon+text inline (false) */
  badge?: boolean;
}

const LIME = '#8DC63F';

export default function JaxiLogo({ size = 'md', badge = false }: JaxiLogoProps) {
  if (badge) {
    // Full logo badge — matches reference image exactly
    const scale = size === 'sm' ? 0.65 : size === 'lg' ? 1.1 : 0.85;
    const w = Math.round(220 * scale);
    const h = Math.round(80 * scale);

    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 220 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="JAXI Builders Inc logo"
        role="img"
      >
        {/* Background rectangle */}
        <rect width="220" height="80" rx="6" fill="#2D2B8F" />

        {/* 2×2 lime squares — all same color */}
        {/* Top-left */}
        <rect x="10" y="10" width="26" height="26" rx="3" fill={LIME} />
        {/* Top-right */}
        <rect x="40" y="10" width="26" height="26" rx="3" fill={LIME} />
        {/* Bottom-left */}
        <rect x="10" y="40" width="26" height="26" rx="3" fill={LIME} />
        {/* Bottom-right */}
        <rect x="40" y="40" width="26" height="26" rx="3" fill={LIME} />

        {/* JAXI — large bold white */}
        <text
          x="80"
          y="50"
          fontFamily="'Arial Black', 'Arial', sans-serif"
          fontSize="42"
          fontWeight="900"
          fill="white"
          letterSpacing="-1"
        >
          JAXI
        </text>

        {/* BUILDERS, INC. — smaller white below */}
        <text
          x="80"
          y="69"
          fontFamily="'Arial', sans-serif"
          fontSize="14"
          fontWeight="600"
          fill="white"
          letterSpacing="1.5"
        >
          BUILDERS, INC.
        </text>
      </svg>
    );
  }

  // Inline version — just the grid + text side by side (for topbar/sidebar)
  const gridSize  = size === 'sm' ? 9  : size === 'lg' ? 16 : 12;
  const gap       = size === 'sm' ? 2  : size === 'lg' ? 3  : 2.5;
  const totalGrid = gridSize * 2 + gap;
  const jaxiSize  = size === 'sm' ? 13 : size === 'lg' ? 20 : 16;
  const subSize   = size === 'sm' ? 8  : size === 'lg' ? 11 : 9;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 12 : 9, userSelect: 'none' }}
      aria-label="JAXI Builders Inc"
    >
      {/* 2×2 Grid — all same lime */}
      <svg
        width={totalGrid}
        height={totalGrid}
        viewBox={`0 0 ${totalGrid} ${totalGrid}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0"            y="0"            width={gridSize} height={gridSize} rx="1.5" fill={LIME} />
        <rect x={gridSize+gap} y="0"            width={gridSize} height={gridSize} rx="1.5" fill={LIME} />
        <rect x="0"            y={gridSize+gap} width={gridSize} height={gridSize} rx="1.5" fill={LIME} />
        <rect x={gridSize+gap} y={gridSize+gap} width={gridSize} height={gridSize} rx="1.5" fill={LIME} />
      </svg>

      {/* Text */}
      <div style={{ lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span
            style={{
              fontSize: jaxiSize,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              fontFamily: "'Arial Black', Arial, sans-serif",
            }}
          >
            JAXI
          </span>
        </div>
        <div
          style={{
            fontSize: subSize,
            fontWeight: 600,
            color: '#a9a4cc',
            letterSpacing: '0.5px',
            marginTop: 1,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          BUILDERS, INC.
        </div>
      </div>
    </div>
  );
}
