import { useState, useEffect } from "react";

const STATUS_CONFIG = {
  urgent: { label: "Urgent", color: "#ff4757", bg: "#ff475718" },
  upcoming: { label: "Upcoming", color: "#ffa502", bg: "#ffa50218" },
  new: { label: "New", color: "#2ed573", bg: "#2ed57318" },
};

const TAG_COLORS = {
  hackathon: "#a78bfa", hack: "#a78bfa", devpost: "#818cf8",
  competition: "#38bdf8", contest: "#38bdf8", challenge: "#34d399",
  ideathon: "#fb923c", datathon: "#f472b6", buildathon: "#fb923c",
  "smart india": "#facc15", sih: "#facc15", mlh: "#c084fc",
  ieee: "#60a5fa", acm: "#4ade80", deadline: "#f87171",
  "submit project": "#f87171", "register now": "#fbbf24",
};

function getTagColor(tag) {
  return TAG_COLORS[tag.toLowerCase()] || "#94a3b8";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function HackRadar() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("grid");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "";

  const fetchEmails = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/emails`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmails(data);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEmails(); }, []);

  const allTags = [...new Set(emails.flatMap(e => e.tags || []))];

  const filtered = emails.filter(e => {
    const s = search.toLowerCase();
    const matchSearch = !s ||
      (e.subject || "").toLowerCase().includes(s) ||
      (e.from || "").toLowerCase().includes(s) ||
      (e.snippet || "").toLowerCase().includes(s);
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchTag = filterTag === "all" || (e.tags || []).includes(filterTag);
    return matchSearch && matchStatus && matchTag;
  });

  const counts = {
    urgent: emails.filter(e => e.status === "urgent").length,
    upcoming: emails.filter(e => e.status === "upcoming").length,
    new: emails.filter(e => e.status === "new").length,
  };

  return (
    <div style={s.root} className="app-root">
      <div style={s.scanline} />
      <div style={s.noise} />

      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={s.logo}>
          <span style={s.logoMark}>⚡</span>
          <div>
            <div style={s.logoName}>HackRadar</div>
            <div style={s.logoSub}>VIT Vellore</div>
          </div>
        </div>
        <button 
          className="hamburger-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside style={s.sidebar} className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={s.sideTop}>
          <div style={s.logo} className="desktop-logo">
            <span style={s.logoMark}>⚡</span>
            <div>
              <div style={s.logoName}>HackRadar</div>
              <div style={s.logoSub}>VIT Vellore</div>
            </div>
          </div>

          <div style={s.sideSection}>
            <div style={s.sideLabel}>FILTER STATUS</div>
            {["all", "urgent", "upcoming", "new"].map(st => (
              <button
                key={st}
                style={{ ...s.sideBtn, ...(filterStatus === st ? s.sideBtnActive : {}) }}
                onClick={() => { setFilterStatus(st); setMobileMenuOpen(false); }}
              >
                <span style={s.sideBtnDot(st)} />
                <span style={s.sideBtnText}>
                  {st === "all" ? "All Emails" : STATUS_CONFIG[st]?.label || st}
                </span>
                <span style={s.sideBtnCount}>
                  {st === "all" ? emails.length : counts[st] || 0}
                </span>
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideLabel}>FILTER TAGS</div>
              <button
                style={{ ...s.sideBtn, ...(filterTag === "all" ? s.sideBtnActive : {}) }}
                onClick={() => { setFilterTag("all"); setMobileMenuOpen(false); }}
              >
                <span style={{ ...s.sideBtnDot("all") }} />
                <span style={s.sideBtnText}>All Tags</span>
              </button>
              <div className="tags-container">
                {allTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    style={{ ...s.sideBtn, ...(filterTag === tag ? s.sideBtnActive : {}) }}
                    onClick={() => { setFilterTag(tag); setMobileMenuOpen(false); }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: getTagColor(tag), flexShrink: 0 }} />
                    <span style={s.sideBtnText}>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={s.sideBottom}>
          <div style={s.connectedDot} />
          <span style={{ fontSize: 11, color: "#475569" }}>Connected · Gmail API</span>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main} className="main-content">
        {/* Topbar */}
        <div style={s.topbar} className="topbar">
          <div style={s.searchWrap} className="search-wrap">
            <span style={{ fontSize: 13, color: "#475569", marginRight: 8 }}>⌕</span>
            <input
              style={s.searchInput}
              placeholder="Search hackathons, competitions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>
          <div style={s.topbarRight} className="topbar-right">
            <div className="view-toggles">
              <button
                style={{ ...s.viewToggle, ...(view === "grid" ? s.viewToggleActive : {}) }}
                onClick={() => setView("grid")} title="Grid view"
              >⊞</button>
              <button
                style={{ ...s.viewToggle, ...(view === "list" ? s.viewToggleActive : {}) }}
                onClick={() => setView("list")} title="List view"
              >☰</button>
            </div>
            <button style={s.refreshBtn} onClick={fetchEmails} disabled={refreshing}>
              <span style={{ display: "inline-block", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>↻</span>
              {refreshing ? " Scanning..." : " Refresh"}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={s.statsStrip} className="stats-strip">
          {[
            { icon: "📬", val: emails.length, label: "Total" },
            { icon: "🔥", val: counts.urgent, label: "Urgent" },
            { icon: "📅", val: counts.upcoming, label: "Upcoming" },
            { icon: "🆕", val: counts.new, label: "New" },
            { icon: "🔍", val: filtered.length, label: "Showing" },
          ].map(({ icon, val, label }) => (
            <div key={label} style={s.statPill} className="stat-pill">
              <span>{icon}</span>
              <span style={s.statVal}>{val}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={s.body} className="body-container">
          {/* Email list */}
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", position: 'relative' }} className="email-list-container">
            {loading ? (
              <div style={s.center}>
                <div style={s.spinner} />
                <div style={{ color: "#475569", marginTop: 16, fontSize: 14 }}>
                  Connecting to Gmail API...
                </div>
              </div>
            ) : error ? (
              <div style={s.center} className="error-container">
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ color: "#f87171", fontSize: 14, marginBottom: 8 }}>Backend Error</div>
                <div style={{ color: "#475569", fontSize: 12, maxWidth: 300, textAlign: "center", marginBottom: 16 }}>{error}</div>
                <div style={{ color: "#334155", fontSize: 12, background: "#0f172a", borderRadius: 8, padding: "8px 16px" }}>
                  Make sure <code style={{ color: "#a78bfa" }}>backend</code> is accessible.
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.center}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: "#475569", fontSize: 14 }}>No emails match your filters</div>
              </div>
            ) : (
              <div style={view === "grid" ? s.grid : s.list} className={view === "grid" ? "grid-view" : "list-view"}>
                {filtered.map((email, i) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    view={view}
                    selected={selected?.id === email.id}
                    onClick={() => setSelected(selected?.id === email.id ? null : email)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <>
              <div className="mobile-overlay" onClick={() => setSelected(null)}></div>
              <DetailPanel email={selected} onClose={() => setSelected(null)} />
            </>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .mobile-header { display: none; }
        .hamburger-btn { background: none; border: none; color: #f1f5f9; font-size: 24px; cursor: pointer; padding: 4px; }
        .mobile-overlay { display: none; }

        .tags-container {
          max-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .app-root { flex-direction: column !important; }
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: #080d17;
            border-bottom: 1px solid #0f1e35;
            z-index: 40;
          }
          .desktop-logo { display: none !important; }
          .sidebar {
            position: absolute;
            top: 65px;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100% !important;
            border-right: none !important;
            z-index: 30;
            display: none !important;
            background: #080d17 !important;
          }
          .sidebar.open { display: flex !important; }
          .topbar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px 16px !important;
            gap: 12px !important;
          }
          .search-wrap { max-width: none !important; }
          .topbar-right { justify-content: space-between !important; width: 100%; }
          .stats-strip {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            padding: 12px 16px !important;
            -webkit-overflow-scrolling: touch;
          }
          .stat-pill { flex-shrink: 0; }
          .grid-view { grid-template-columns: 1fr !important; padding: 16px !important; }
          .list-view { padding: 12px 16px !important; }
          
          .detail-panel {
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100% !important;
            z-index: 50;
            border-left: none !important;
          }
          .mobile-overlay {
            display: block;
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 40;
          }
        }
      `}</style>
    </div>
  );
}

function EmailCard({ email, view, selected, onClick, index }) {
  const st = STATUS_CONFIG[email.status] || STATUS_CONFIG.new;
  const isGrid = view === "grid";

  return (
    <div
      onClick={onClick}
      style={{
        ...s.card,
        ...(isGrid ? {} : s.cardList),
        ...(selected ? s.cardSelected : {}),
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div style={s.cardHeader}>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>
          {email.status === "urgent" ? "🔥" : email.status === "upcoming" ? "📅" : "🆕"} {st.label}
        </span>
        {email.deadline && (
          <span style={s.deadlineBadge}>⏰ {email.deadline}</span>
        )}
        <span style={{ ...s.timeAgo, marginLeft: "auto" }}>{timeAgo(email.date)}</span>
      </div>

      <div style={s.cardSubject}>{email.subject || "No Subject"}</div>
      <div style={s.cardFrom}>{email.from}</div>

      {isGrid && (
        <p style={s.cardSnippet}>{(email.snippet || "").slice(0, 110)}{email.snippet?.length > 110 ? "…" : ""}</p>
      )}

      <div style={s.cardTags}>
        {(email.tags || []).slice(0, 4).map(tag => (
          <span key={tag} style={{ ...s.tag, color: getTagColor(tag), background: getTagColor(tag) + "18" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ email, onClose }) {
  const st = STATUS_CONFIG[email.status] || STATUS_CONFIG.new;
  return (
    <div style={s.detail} className="detail-panel">
      <div style={s.detailTopbar}>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>
          {st.label}
        </span>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      <h2 style={s.detailSubject}>{email.subject}</h2>

      <div style={s.detailMeta}>
        <div style={s.metaRow}><span style={s.metaKey}>From</span><span style={s.metaVal}>{email.from}</span></div>
        <div style={s.metaRow}><span style={s.metaKey}>Date</span><span style={s.metaVal}>{email.date ? new Date(email.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "—"}</span></div>
        {email.deadline && (
          <div style={s.metaRow}>
            <span style={s.metaKey}>Deadline</span>
            <span style={{ ...s.metaVal, color: "#f87171", fontWeight: 600 }}>⏰ {email.deadline}</span>
          </div>
        )}
      </div>

      <div style={s.detailDivider} />

      <div style={s.detailBodyLabel}>Message Content</div>
      <div style={s.detailBody}>{email.body_full || email.body_preview || email.snippet || "No content available."}</div>

      <div style={s.detailDivider} />

      <div style={s.detailTags}>
        {(email.tags || []).map(tag => (
          <span key={tag} style={{ ...s.tag, color: getTagColor(tag), background: getTagColor(tag) + "18", fontSize: 12 }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const s = {
  root: {
    display: "flex", height: "100vh", width: "100vw", overflow: "hidden",
    background: "#060a12", fontFamily: "'Outfit', sans-serif",
    color: "#cbd5e1", position: "relative",
  },
  scanline: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
  },
  noise: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99, opacity: 0.015,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
  },
  sidebar: {
    width: 220, flexShrink: 0, background: "#080d17",
    borderRight: "1px solid #0f1e35", display: "flex",
    flexDirection: "column", justifyContent: "space-between",
    padding: "24px 0", overflow: "hidden",
  },
  sideTop: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 28 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoMark: { fontSize: 24, lineHeight: 1 },
  logoName: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 18, color: "#f1f5f9", letterSpacing: -0.5 },
  logoSub: { fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 1 },
  sideSection: { display: "flex", flexDirection: "column", gap: 2 },
  sideLabel: { fontSize: 9, color: "#334155", letterSpacing: 2, fontWeight: 600, textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 },
  sideBtn: {
    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
    borderRadius: 8, border: "none", background: "transparent", cursor: "pointer",
    color: "#475569", fontSize: 13, fontFamily: "'Outfit', sans-serif", width: "100%", textAlign: "left",
    transition: "all 0.15s",
  },
  sideBtnActive: { background: "#0f1e35", color: "#e2e8f0" },
  sideBtnDot: (st) => ({
    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
    background: st === "urgent" ? "#ff4757" : st === "upcoming" ? "#ffa502" : st === "new" ? "#2ed573" : "#334155",
  }),
  sideBtnText: { flex: 1, fontSize: 13 },
  sideBtnCount: { fontSize: 11, color: "#334155", fontFamily: "'JetBrains Mono', monospace" },
  sideBottom: { padding: "0 20px", display: "flex", alignItems: "center", gap: 8 },
  connectedDot: { width: 6, height: 6, borderRadius: "50%", background: "#2ed573", animation: "pulse 2s ease infinite" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 },
  topbar: {
    display: "flex", alignItems: "center", gap: 12, padding: "16px 24px",
    borderBottom: "1px solid #0f1e35", background: "#070b14",
  },
  searchWrap: {
    flex: 1, display: "flex", alignItems: "center",
    background: "#0c1524", border: "1px solid #0f1e35", borderRadius: 10,
    padding: "0 14px", maxWidth: 480,
  },
  searchInput: {
    background: "transparent", border: "none", outline: "none",
    color: "#cbd5e1", fontSize: 14, padding: "10px 0", width: "100%",
    fontFamily: "'Outfit', sans-serif",
  },
  clearBtn: { background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, padding: "2px 4px" },
  topbarRight: { display: "flex", gap: 8, alignItems: "center" },
  viewToggle: {
    background: "#0c1524", border: "1px solid #0f1e35", borderRadius: 8,
    color: "#475569", padding: "8px 11px", fontSize: 16, cursor: "pointer", lineHeight: 1,
  },
  viewToggleActive: { color: "#a78bfa", borderColor: "#3730a3", background: "#1e1b4b40" },
  refreshBtn: {
    background: "linear-gradient(135deg, #4f46e5, #0891b2)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", letterSpacing: 0.2,
  },
  statsStrip: {
    display: "flex", gap: 8, padding: "10px 24px",
    borderBottom: "1px solid #0a1628", background: "#060a12", flexWrap: "wrap",
  },
  statPill: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#0c1524", border: "1px solid #0f1e35",
    borderRadius: 20, padding: "4px 12px", fontSize: 12,
  },
  statVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#e2e8f0", fontWeight: 500 },
  statLabel: { color: "#475569", fontSize: 11 },
  body: { flex: 1, display: "flex", overflow: "hidden", position: "relative" },
  grid: {
    padding: 24, display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: 14, overflowY: "auto", alignContent: "start",
  },
  list: { padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
  card: {
    background: "#0a1220", border: "1px solid #0f1e35", borderRadius: 12,
    padding: "16px 18px", cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    animation: "fadeUp 0.3s ease both",
  },
  cardList: { display: "flex", flexDirection: "column" },
  cardSelected: { borderColor: "#4f46e5", background: "#1e1b4b20" },
  cardHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  statusBadge: { fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 20, letterSpacing: 0.4 },
  deadlineBadge: { fontSize: 10, color: "#f87171", background: "#f8717118", padding: "2px 8px", borderRadius: 20 },
  timeAgo: { fontSize: 10, color: "#334155", fontFamily: "'JetBrains Mono', monospace" },
  cardSubject: { fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 4 },
  cardFrom: { fontSize: 11, color: "#334155", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardSnippet: { fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 10 },
  cardTags: { display: "flex", gap: 5, flexWrap: "wrap" },
  tag: { fontSize: 10, padding: "2px 9px", borderRadius: 20, fontWeight: 500 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "#475569" },
  spinner: {
    width: 36, height: 36, border: "3px solid #0f1e35",
    borderTop: "3px solid #4f46e5", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  detail: {
    width: 340, flexShrink: 0, background: "#080d17",
    borderLeft: "1px solid #0f1e35", padding: 24,
    overflowY: "auto", animation: "fadeUp 0.2s ease",
  },
  detailTopbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  closeBtn: { background: "#0c1524", border: "1px solid #0f1e35", borderRadius: 8, color: "#475569", width: 28, height: 28, cursor: "pointer", fontSize: 12 },
  detailSubject: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 16 },
  detailMeta: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  metaRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  metaKey: { fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, minWidth: 55, paddingTop: 2 },
  metaVal: { fontSize: 12, color: "#94a3b8", lineHeight: 1.5 },
  detailDivider: { height: 1, background: "#0f1e35", margin: "16px 0" },
  detailBodyLabel: { fontSize: 9, color: "#334155", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 },
  detailBody: { fontSize: 12, color: "#64748b", lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  detailTags: { display: "flex", gap: 6, flexWrap: "wrap" },
};