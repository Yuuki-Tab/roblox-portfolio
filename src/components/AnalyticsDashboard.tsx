import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const FUNCTIONS_URL = 'https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1';
const PERIODS = ['1d', '7d', '30d', '90d'] as const;
type Period = (typeof PERIODS)[number];

const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
const flag = (code: string) =>
  code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
const deviceEmoji = (d: string) => {
  const l = d.toLowerCase();
  if (l === 'mobile') return '📱';
  if (l === 'tablet') return '📟';
  return '💻';
};
const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
const periodDays = (p: Period) => parseInt(p);

/* ─── Types ─── */
interface AnalyticsData {
  summary: { total_views: number; unique_visitors: number };
  views_by_day: { date: string; views: number; uniques: number }[];
  views_by_hour: { hour: number; views: number }[];
  top_pages: { path: string; views: number; uniques: number }[];
  top_referrers: { referrer: string | null; views: number }[];
  devices: { device_type: string; views: number }[];
  browsers: { browser: string; views: number }[];
  countries: { country: string; views: number }[];
  recent_visitors: {
    visitor_id: string;
    page_path: string;
    device_type: string;
    browser: string;
    country: string;
    referrer: string | null;
    visited_at: string;
  }[];
}

/* ─── Password Gate ─── */
function LoginGate({ onAuth }: { onAuth: (pwd: string) => void }) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/analytics?period=1d`, {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (res.ok) {
        sessionStorage.setItem('analytics_pwd', pwd);
        onAuth(pwd);
      } else {
        setError(true);
        inputRef.current?.focus();
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <div className="analytics-login-wrapper">
        <div className={`analytics-login ${error ? 'shake' : ''}`} onAnimationEnd={() => setError(false)}>
          <div className="analytics-login-icon">🔒</div>
          <h1 className="analytics-login-title">
            <span className="gradient-text">Analytics</span>
          </h1>
          <p className="analytics-login-sub">Enter password to access the dashboard</p>
          <form onSubmit={submit} className="analytics-login-form">
            <div className="form-field">
              <input
                ref={inputRef}
                type="password"
                placeholder="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                className={error ? 'analytics-input-error' : ''}
              />
            </div>
            {error && <p className="analytics-error-text">Invalid password. Try again.</p>}
            <button type="submit" className="analytics-login-btn" disabled={loading || !pwd.trim()}>
              {loading ? (
                <span className="analytics-spinner" />
              ) : (
                <>
                  Access Dashboard
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function Skeleton({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div className="analytics-skeleton" style={{ width, height, borderRadius: 8 }} />;
}

function SkeletonCards() {
  return (
    <div className="analytics-stats">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="analytics-stat-card">
          <Skeleton height={14} width="40%" />
          <Skeleton height={40} width="60%" />
          <Skeleton height={12} width="30%" />
        </div>
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="analytics-panel">
      <Skeleton height={18} width="30%" />
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200, marginTop: 16 }}>
        {[...Array(14)].map((_, i) => (
          <Skeleton key={i} height={40 + Math.random() * 140} width="100%" />
        ))}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="analytics-panel">
      <Skeleton height={18} width="40%" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height={36} width="100%" />
      ))}
    </div>
  );
}

/* ─── Bar Chart (SVG) ─── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(100 / data.length - 1.5, 2);
  const gap = 100 / data.length;

  return (
    <div className="analytics-chart-wrap">
      <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="analytics-chart-svg">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / maxVal) * 44;
          return (
            <g key={i}>
              <rect
                className="analytics-bar"
                x={i * gap + (gap - barWidth) / 2}
                y={48 - h}
                width={barWidth}
                height={h}
                rx={barWidth > 3 ? 1.5 : 0.5}
                fill="url(#barGrad)"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <title>{`${d.label}: ${fmt(d.value)} views`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="analytics-chart-labels">
        {data.map((d, i) =>
          i % Math.ceil(data.length / 7) === 0 ? (
            <span key={i} className="analytics-chart-label" style={{ left: `${i * gap + gap / 2}%` }}>
              {d.label}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

/* ─── Horizontal Bar ─── */
function HorizontalBars({
  data,
  colorFn,
}: {
  data: { label: string; value: number }[];
  colorFn?: (i: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="analytics-hbars">
      {data.map((d, i) => (
        <div key={d.label} className="analytics-hbar-row">
          <span className="analytics-hbar-label">{d.label}</span>
          <div className="analytics-hbar-track">
            <div
              className="analytics-hbar-fill"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                background: colorFn?.(i) ?? 'var(--gradient)',
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <span className="analytics-hbar-count">{fmt(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="analytics-donut-wrap">
      <svg viewBox="0 0 100 100" className="analytics-donut-svg">
        {data.map((d) => {
          const pct = d.value / total;
          const dashLen = pct * circumference;
          const currentOffset = offset;
          offset += dashLen;
          return (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="12"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-currentOffset}
              className="analytics-donut-segment"
              strokeLinecap="round"
            >
              <title>{`${d.label}: ${fmt(d.value)} (${(pct * 100).toFixed(1)}%)`}</title>
            </circle>
          );
        })}
        <text x="50" y="47" textAnchor="middle" fill="var(--text-hi)" fontSize="12" fontWeight="700">
          {fmt(total)}
        </text>
        <text x="50" y="59" textAnchor="middle" fill="var(--text-mid)" fontSize="5">
          total
        </text>
      </svg>
      <div className="analytics-donut-legend">
        {data.map((d) => (
          <div key={d.label} className="analytics-donut-legend-item">
            <span className="analytics-donut-dot" style={{ background: d.color }} />
            <span className="analytics-donut-legend-label">{d.label}</span>
            <span className="analytics-donut-legend-val">{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
function Dashboard({ initialPwd }: { initialPwd: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pwd = useRef(initialPwd);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${pwd.current}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // auto-refresh every 60s when visible
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const start = () => {
      timer = setInterval(() => {
        if (!document.hidden) fetchData(period);
      }, 60000);
    };
    start();
    return () => clearInterval(timer);
  }, [period, fetchData]);

  const logout = () => {
    sessionStorage.removeItem('analytics_pwd');
    window.location.reload();
  };

  const topCountry = useMemo(() => {
    if (!data?.countries?.length) return '—';
    const c = data.countries[0];
    return c.country !== 'Unknown' ? `${flag(c.country)} ${c.country}` : '🌐 Unknown';
  }, [data]);

  const avgPerDay = useMemo(() => {
    if (!data) return 0;
    const days = periodDays(period);
    return Math.round(data.summary.total_views / days);
  }, [data, period]);

  const deviceColors: Record<string, string> = {
    desktop: '#a855f7',
    mobile: '#7c3aed',
    tablet: '#6d28d9',
  };

  const browserColors = ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

  if (error && !data) {
    return (
      <div className="analytics-page">
        <div className="analytics-login-wrapper">
          <div className="analytics-login">
            <div className="analytics-login-icon">⚠️</div>
            <h2 style={{ color: 'var(--text-hi)', marginBottom: 8 }}>Something went wrong</h2>
            <p className="analytics-login-sub">{error}</p>
            <button className="analytics-login-btn" onClick={() => fetchData(period)} style={{ marginTop: 16 }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <header className="analytics-header">
          <div className="analytics-header-left">
            <h1 className="analytics-title">
              <span className="gradient-text">Analytics</span>
            </h1>
            {lastUpdated && (
              <span className="analytics-updated mono">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="analytics-header-right">
            <div className="analytics-pills">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  className={`analytics-pill ${p === period ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="analytics-logout" onClick={logout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        {loading && !data ? (
          <>
            <SkeletonCards />
            <SkeletonChart />
            <div className="analytics-grid">
              <SkeletonTable />
              <SkeletonTable />
              <SkeletonTable />
            </div>
          </>
        ) : data ? (
          <>
            <div className="analytics-stats">
              <div className="analytics-stat-card">
                <span className="analytics-stat-icon">📊</span>
                <span className="analytics-stat-value">{fmt(data.summary.total_views)}</span>
                <span className="analytics-stat-label">Total Views</span>
              </div>
              <div className="analytics-stat-card">
                <span className="analytics-stat-icon">👥</span>
                <span className="analytics-stat-value">{fmt(data.summary.unique_visitors)}</span>
                <span className="analytics-stat-label">Unique Visitors</span>
              </div>
              <div className="analytics-stat-card">
                <span className="analytics-stat-icon">📈</span>
                <span className="analytics-stat-value">{fmt(avgPerDay)}</span>
                <span className="analytics-stat-label">Avg. Views / Day</span>
              </div>
              <div className="analytics-stat-card">
                <span className="analytics-stat-icon">🌍</span>
                <span className="analytics-stat-value analytics-stat-value-sm">{topCountry}</span>
                <span className="analytics-stat-label">Top Country</span>
              </div>
            </div>

            {/* Views Over Time */}
            <div className="analytics-panel">
              <h3 className="analytics-panel-title">Views Over Time</h3>
              {data.views_by_day.length > 0 ? (
                <BarChart
                  data={data.views_by_day.map((d) => ({
                    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: d.views,
                  }))}
                />
              ) : (
                <p className="analytics-empty">No data for this period</p>
              )}
            </div>

            {/* Hourly Distribution */}
            {data.views_by_hour?.length > 0 && (
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Hourly Distribution</h3>
                <HorizontalBars
                  data={data.views_by_hour.map((d) => ({
                    label: `${String(d.hour).padStart(2, '0')}:00`,
                    value: d.views,
                  }))}
                />
              </div>
            )}

            {/* Grid */}
            <div className="analytics-grid">
              {/* Top Pages */}
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Top Pages</h3>
                {data.top_pages.length > 0 ? (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Views</th>
                        <th>Unique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_pages.map((p) => (
                        <tr key={p.path}>
                          <td className="analytics-table-page">{p.path}</td>
                          <td>{fmt(p.views)}</td>
                          <td>{fmt(p.uniques)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="analytics-empty">No page data</p>
                )}
              </div>

              {/* Top Referrers */}
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Top Referrers</h3>
                {data.top_referrers.length > 0 ? (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_referrers.map((r, i) => (
                        <tr key={i}>
                          <td className="analytics-table-page">{r.referrer || 'Direct'}</td>
                          <td>{fmt(r.views)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="analytics-empty">No referrer data</p>
                )}
              </div>

              {/* Devices */}
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Devices</h3>
                {data.devices.length > 0 ? (
                  <DonutChart
                    data={data.devices.map((d) => ({
                      label: d.device_type,
                      value: d.views,
                      color: deviceColors[d.device_type] || '#a855f7',
                    }))}
                  />
                ) : (
                  <p className="analytics-empty">No device data</p>
                )}
              </div>

              {/* Browsers */}
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Browsers</h3>
                {data.browsers.length > 0 ? (
                  <HorizontalBars
                    data={data.browsers.map((b) => ({
                      label: b.browser,
                      value: b.views,
                    }))}
                    colorFn={(i) => browserColors[i % browserColors.length]}
                  />
                ) : (
                  <p className="analytics-empty">No browser data</p>
                )}
              </div>

              {/* Countries */}
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Countries</h3>
                {data.countries.length > 0 ? (
                  <HorizontalBars
                    data={data.countries.map((c) => ({
                      label: c.country !== 'Unknown' ? `${flag(c.country)} ${c.country}` : '🌐 Unknown',
                      value: c.views,
                    }))}
                  />
                ) : (
                  <p className="analytics-empty">No country data</p>
                )}
              </div>
            </div>

            {/* Recent Visitors */}
            {data.recent_visitors?.length > 0 && (
              <div className="analytics-panel">
                <h3 className="analytics-panel-title">Recent Visitors</h3>
                <div className="analytics-feed">
                  {data.recent_visitors.map((v, i) => (
                    <div key={i} className="analytics-feed-row" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="analytics-feed-id mono">{v.visitor_id.slice(0, 8)}</span>
                      <span className="analytics-feed-page">{v.page_path}</span>
                      <span className="analytics-feed-device">{deviceEmoji(v.device_type)}</span>
                      <span className="analytics-feed-browser">{v.browser}</span>
                      <span className="analytics-feed-country">{v.country ? flag(v.country) : '🌐'}</span>
                      <span className="analytics-feed-time">{relTime(v.visited_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading indicator for refresh */}
            {loading && <div className="analytics-refresh-bar" />}
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Exported Component ─── */
export function AnalyticsDashboard() {
  const [pwd, setPwd] = useState<string | null>(() => sessionStorage.getItem('analytics_pwd'));

  if (!pwd) return <LoginGate onAuth={setPwd} />;
  return <Dashboard initialPwd={pwd} />;
}
