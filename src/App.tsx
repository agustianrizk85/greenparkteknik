import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardData, ProyekMetric, KurvaWeek, Tone } from "./types";
import { api } from "./api/client";
import { useDashboard } from "./hooks/useDashboard";
import { useScale } from "./hooks/useScale";
import { useLogo } from "./hooks/useLogo";
import { Clock } from "./components/Clock";
import { Icon } from "./components/Icon";
import { Bar, Kpi, Panel, Pill } from "./components/ui";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./components/Login";
import { MasterData } from "./master/MasterData";
import { ProsesBisnis } from "./components/ProsesBisnis";
import { AiInsight } from "./components/AiInsight";

interface TabDef {
  id: string;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "deviasi", label: "Deviasi & SPI", icon: "alert" },
  { id: "kpi", label: "KPI Direksi", icon: "trend" },
  { id: "proses", label: "Proses Bisnis", icon: "rec" },
  { id: "master", label: "Master Data", icon: "db" },
];

/** Deviation status → pill tone. */
function statusTone(status: string): Tone {
  switch (status) {
    case "Sangat Cepat":
      return "neutral";
    case "Lebih Cepat":
    case "On Schedule":
      return "green";
    case "Warning":
      return "yellow";
    default:
      return "red";
  }
}

const pct = (v: number) => `${v.toFixed(1)}%`;
const rupiah = (v: number) =>
  v >= 1e9 ? `Rp ${(v / 1e9).toFixed(2)} M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(0)} jt` : `Rp ${v.toLocaleString("id-ID")}`;

export function App() {
  useScale();
  const { status } = useAuth();
  if (status === "checking") {
    return (
      <Splash>
        <div className="spinner" />
        Memeriksa sesi…
      </Splash>
    );
  }
  if (status === "out") return <Login />;
  return <Authenticated />;
}

function Authenticated() {
  const [state, reload] = useDashboard();
  if (state.status === "loading") {
    return (
      <Splash>
        <div className="spinner" />
        Memuat data teknik…
      </Splash>
    );
  }
  if (state.status === "error") {
    return (
      <Splash tone="error">
        <div className="splash-title">Gagal memuat data</div>
        <div className="splash-msg">{state.error}</div>
        <div className="splash-msg">API: {api.base}</div>
        <button className="splash-btn" onClick={reload}>
          Coba lagi
        </button>
      </Splash>
    );
  }
  return <Dashboard D={state.data} />;
}

function Splash({ tone, children }: { tone?: "error"; children: ReactNode }) {
  return <div className={`splash ${tone ?? ""}`}>{children}</div>;
}

function Dashboard({ D }: { D: DashboardData }) {
  const [logo, onLogoDrop] = useLogo();
  const [tab, setTab] = useState<string>(() => localStorage.getItem("gp_tab") ?? "overview");
  const [sel, setSel] = useState<ProyekMetric | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("gp_tab", tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  return (
    <>
      <Header logo={logo} onLogoDrop={onLogoDrop} />
      <Tabs tab={tab} setTab={setTab} />
      <div className="body">
        {tab === "master" ? (
          <MasterData />
        ) : tab === "proses" ? (
          <ProsesBisnis />
        ) : tab === "deviasi" ? (
          <DeviasiView D={D} onProject={setSel} />
        ) : tab === "kpi" ? (
          <KpiView D={D} onProject={setSel} />
        ) : (
          <Overview D={D} setTab={setTab} onProject={setSel} />
        )}
      </div>
      {sel && <ProjectModal p={sel} onClose={() => setSel(null)} />}
    </>
  );
}

function Header({ logo, onLogoDrop }: { logo: string; onLogoDrop: (e: React.DragEvent) => void }) {
  return (
    <header className="hdr">
      <div className="hdr-logo" onDrop={onLogoDrop} onDragOver={(e) => e.preventDefault()} title="Drag & drop logo Greenpark">
        {logo ? <img src={logo} alt="logo" /> : (<span>Drop<br />Logo</span>)}
      </div>
      <div className="hdr-titles">
        <h1>DASHBOARD TEKNIK GREENPARK GROUP</h1>
        <div className="sub">Kendali Progres Pembangunan — Kurva S · Deviasi · SPI (data relasional)</div>
        <div className="tag">ONE TEAM · ONE SYSTEM · ONE DASHBOARD · ONE GOAL</div>
      </div>
      <span className="hdr-spacer" />
      <div className="hdr-meta">
        <Clock />
        <div className="badge-target">
          <small>TARGET 2026</small>500 UNIT
        </div>
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  return (
    <div className="usermenu">
      <div className="usermenu-info">
        <span className="usermenu-name">{user?.name}</span>
        <span className="usermenu-role">{user?.role}</span>
      </div>
      <button className="usermenu-logout" onClick={() => void logout()} title="Keluar">
        <Icon name="logout" size={16} />
      </button>
    </div>
  );
}

function Tabs({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
          <Icon name={t.icon} size={15} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* ---- Overview ---------------------------------------------------------- */

function Overview({ D, setTab, onProject }: { D: DashboardData; setTab: (t: string) => void; onProject: (p: ProyekMetric) => void }) {
  const s = D.summary;
  const goDeviasi = () => setTab("deviasi");
  const attention = [...D.proyek]
    .filter((p) => p.status === "Critical Delay" || p.status === "Warning")
    .sort((a, b) => a.deviasi - b.deviasi);
  return (
    <>
      <div className="kpi-row">
        <Kpi label="Total Proyek" value={s.totalProyek} />
        <Kpi label="Total Unit" value={s.totalUnits} />
        <Kpi label="Total SPK" value={s.totalSpk} />
        <Kpi label="Overall Progress" value={pct(s.overall)} tone={s.overall >= 50 ? "ok" : "warn"} />
        <Kpi label="On Schedule" value={s.onSchedule} tone="ok" onClick={goDeviasi} hint="Lihat detail" />
        <Kpi label="Warning" value={s.warning} tone="warn" onClick={goDeviasi} hint="Perlu dipantau →" />
        <Kpi label="Critical Delay" value={s.critical} tone="bad" onClick={goDeviasi} hint="Butuh recovery →" />
        <Kpi label="Avg SPI" value={s.avgSpi.toFixed(2)} tone={s.avgSpi >= 1 ? "ok" : "warn"} />
      </div>

      <Panel
        tag="BUTUH PERHATIAN"
        title={`${attention.length} Proyek Terlambat / Berisiko`}
        sub="klik kartu untuk detail & rekomendasi tindakan"
        onExpand={goDeviasi}
      >
        {attention.length === 0 ? (
          <div className="tbl-empty">✓ Semua proyek on schedule.</div>
        ) : (
          <div className="attn-grid">
            {attention.map((p) => (
              <button key={p.id} className={`attn-card ${statusTone(p.status)}`} onClick={() => onProject(p)}>
                <div className="attn-top">
                  <span className="attn-name">{p.nama}</span>
                  <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                </div>
                <div className="attn-big">{p.lateWeeks > 0 ? `Telat ${p.lateWeeks.toFixed(1)} mgg` : `Deviasi ${p.deviasi.toFixed(1)}%`}</div>
                <div className="attn-sub">
                  Aktual {pct(p.aktual)} vs target {pct(p.target)} · {p.units} unit · {p.kontraktor || "—"}
                </div>
                <div className="attn-cta">Klik untuk detail & rekomendasi →</div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <AiInsight scope="overview" label="Ringkasan Eksekutif" />
      <KurvaView D={D} />
      <div className="grid grid-2">
        <Panel tag="PROYEK" title="Progress per Proyek" sub={`${D.proyek.length} proyek · klik baris untuk detail`}>
          <ProyekTable rows={D.proyek} onRow={onProject} />
        </Panel>
        <Panel tag="KONTRAKTOR" title="Ranking Kontraktor" sub="berdasarkan jumlah SPK & nilai kontrak">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr><th>#</th><th>Kontraktor</th><th className="num">SPK</th><th className="num">Nilai Kontrak</th></tr>
              </thead>
              <tbody>
                {D.kontraktor.map((k, i) => (
                  <tr key={k.id}>
                    <td>{i + 1}</td>
                    <td>{k.nama}</td>
                    <td className="num">{k.units}</td>
                    <td className="num">{rupiah(k.nilai)}</td>
                  </tr>
                ))}
                {D.kontraktor.length === 0 && <tr><td colSpan={4} className="tbl-empty">Belum ada kontraktor.</td></tr>}
              </tbody>
            </table>
          </div>
          <AiInsight scope="kontraktor" label="Evaluasi Vendor" />
        </Panel>
      </div>
    </>
  );
}

function ProyekTable({ rows, onRow }: { rows: ProyekMetric[]; onRow?: (p: ProyekMetric) => void }) {
  return (
    <div className="tbl-scroll">
      <table className="tbl">
        <thead>
          <tr>
            <th>Proyek</th><th>Cluster</th><th>SPV</th><th className="num">Unit</th>
            <th className="num">Aktual</th><th className="num">Target</th><th className="num">Deviasi</th>
            <th className="num">SPI</th><th className="num">Telat (mgg)</th><th>Status</th><th>Kontraktor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className={onRow ? "clickable" : ""} onClick={onRow ? () => onRow(p) : undefined}>
              <td><b>{p.nama}</b></td>
              <td>{p.clusterKode}</td>
              <td>{p.spv || "—"}</td>
              <td className="num">{p.units}</td>
              <td className="num">{pct(p.aktual)}</td>
              <td className="num">{pct(p.target)}</td>
              <td className="num" style={{ color: p.deviasi < -1 ? "var(--bad)" : p.deviasi >= 1 ? "var(--ok)" : undefined }}>
                {p.deviasi > 0 ? "+" : ""}{p.deviasi.toFixed(1)}
              </td>
              <td className="num">{p.spi.toFixed(2)}</td>
              <td className="num" style={{ color: p.lateWeeks > 0 ? "var(--bad)" : undefined }}>
                {p.lateWeeks > 0 ? `▲ ${p.lateWeeks.toFixed(1)}` : "—"}
              </td>
              <td><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
              <td>{p.kontraktor || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Kurva S ----------------------------------------------------------- */

/** Map a cumulative % onto the weekly Kurva S baseline → (fractional) week. */
function planWeekFE(kurva: KurvaWeek[], cum: number): number {
  if (cum <= 0 || !kurva.length) return 0;
  let pw = 0, pc = 0;
  for (const k of kurva) {
    if (k.cumulative >= cum) {
      const span = k.cumulative - pc;
      return span <= 0 ? k.week : pw + ((cum - pc) / span) * (k.week - pw);
    }
    pw = k.week;
    pc = k.cumulative;
  }
  return kurva[kurva.length - 1].week;
}

function statusColor(status: string): string {
  switch (status) {
    case "Sangat Cepat":
      return "#4a90d9";
    case "Lebih Cepat":
    case "On Schedule":
      return "var(--ok)";
    case "Warning":
      return "var(--warn)";
    default:
      return "var(--bad)";
  }
}

function KurvaView({ D }: { D: DashboardData }) {
  const [focus, setFocus] = useState<string>("all");
  const weeks = [...D.kurvaBaseline].sort((a, b) => a.week - b.week);
  const W = 760, H = 340, padL = 42, padB = 30, padT = 16, padR = 16;
  const maxWeek = weeks.length || 20;
  const x = (wk: number) => padL + ((Math.max(1, Math.min(maxWeek, wk)) - 1) / (maxWeek - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - padT - padB);
  const planPts = weeks.map((w) => `${x(w.week)},${y(w.cumulative)}`).join(" ");
  const dots = D.proyek.filter((p) => p.week > 0 && (focus === "all" || p.id === focus));
  const sel = D.proyek.find((p) => p.id === focus);

  return (
    <Panel
      tag="KURVA S"
      title="Kurva S — Posisi Tiap Proyek vs Rencana"
      sub="garis biru = rencana baseline · tiap titik = 1 proyek pada minggu berjalannya · titik di bawah garis = tertinggal"
    >
      <div className="kurva-wrap">
        <div className="kurva-toolbar">
          <select value={focus} onChange={(e) => setFocus(e.target.value)}>
            <option value="all">Semua proyek ({dots.length})</option>
            {D.proyek.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
          {sel && (
            <span className="kurva-selinfo">
              {sel.nama}: minggu ~{sel.week} · aktual {pct(sel.aktual)} · target {pct(sel.target)} ·{" "}
              <b style={{ color: statusColor(sel.status) }}>{sel.status}</b>
            </span>
          )}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="kurva-svg" preserveAspectRatio="xMidYMid meet">
          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="var(--line)" strokeWidth="1" />
              <text x={padL - 6} y={y(g) + 3} textAnchor="end" className="kurva-axis">{g}</text>
            </g>
          ))}
          {weeks.filter((_, i) => i % 2 === 0).map((w) => (
            <text key={w.week} x={x(w.week)} y={H - padB + 16} textAnchor="middle" className="kurva-axis">M{w.week}</text>
          ))}
          {/* plan curve */}
          <polyline points={planPts} fill="none" stroke="#4a90d9" strokeWidth="2.5" />
          {/* per-project dots */}
          {dots.map((p) => (
            <g key={p.id}>
              {focus === p.id && (
                <line x1={x(p.week)} y1={y(p.target)} x2={x(p.week)} y2={y(p.aktual)} stroke={statusColor(p.status)} strokeDasharray="3 3" strokeWidth="1.5" />
              )}
              <circle cx={x(p.week)} cy={y(p.aktual)} r={focus === p.id ? 6 : 4} fill={statusColor(p.status)} stroke="#fff" strokeWidth="1">
                <title>{`${p.nama} — minggu ~${p.week}, aktual ${p.aktual.toFixed(1)}%, target ${p.target.toFixed(1)}%, deviasi ${p.deviasi.toFixed(1)} (${p.status})`}</title>
              </circle>
            </g>
          ))}
        </svg>
        <div className="kurva-legend">
          <span><i className="lg-line" style={{ background: "#4a90d9" }} /> Rencana (baseline)</span>
          <span><i className="lg-dot" style={{ background: "var(--ok)" }} /> On/Ahead</span>
          <span><i className="lg-dot" style={{ background: "var(--warn)" }} /> Warning</span>
          <span><i className="lg-dot" style={{ background: "var(--bad)" }} /> Critical</span>
        </div>
      </div>
      <div className="tbl-scroll" style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>Minggu</th><th className="num">Bobot Mingguan</th><th className="num">Target Kumulatif</th><th>Progres</th></tr></thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.id}>
                <td>M{w.week}</td>
                <td className="num">{w.weight.toFixed(2)}%</td>
                <td className="num">{w.cumulative.toFixed(2)}%</td>
                <td style={{ minWidth: 160 }}><Bar value={w.cumulative} tone="green" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StageSchedule D={D} weeks={weeks} />
      <AiInsight scope="kurva" label="Narasi Jadwal" />
    </Panel>
  );
}

/** Jadwal Tahap: setiap tahap dipetakan ke perkiraan minggu & durasi dari bobot
 * kumulatif terhadap baseline Kurva S — menjawab "tahap X jatuh di minggu berapa". */
function StageSchedule({ D, weeks }: { D: DashboardData; weeks: KurvaWeek[] }) {
  const sorted = [...D.constructionStages].sort((a, b) => a.no - b.no);
  let cum = 0;
  const rows = sorted.map((s) => {
    const before = cum;
    cum += s.weight;
    const mulai = planWeekFE(weeks, before > 0 ? before : 0.01);
    const selesai = planWeekFE(weeks, cum);
    return { s, before, after: cum, mulai, selesai, durasi: Math.max(0, selesai - mulai) };
  });
  return (
    <div className="tbl-scroll" style={{ marginTop: 12 }}>
      <div className="kurva-subhead">Jadwal Tahap (perkiraan dari bobot vs Kurva S)</div>
      <table className="tbl">
        <thead>
          <tr>
            <th>#</th><th>Tahap</th><th>Termin</th><th className="num">Bobot</th>
            <th className="num">Kumulatif</th><th className="num">Minggu</th><th className="num">Durasi (mgg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.s.id}>
              <td>{r.s.no}</td>
              <td>{r.s.name}</td>
              <td>{r.s.termin}</td>
              <td className="num">{r.s.weight.toFixed(2)}%</td>
              <td className="num">{r.after.toFixed(2)}%</td>
              <td className="num">M{Math.round(r.mulai) || 1}–M{Math.round(r.selesai) || 1}</td>
              <td className="num">{r.durasi.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Deviasi & SPI ----------------------------------------------------- */

function DeviasiView({ D, onProject }: { D: DashboardData; onProject: (p: ProyekMetric) => void }) {
  const rows = [...D.proyek].sort((a, b) => a.deviasi - b.deviasi); // worst first
  const s = D.summary;
  return (
    <>
      <div className="kpi-row">
        <Kpi label="Avg Deviasi" value={`${s.avgDeviasi > 0 ? "+" : ""}${s.avgDeviasi.toFixed(1)}%`} tone={s.avgDeviasi < -1 ? "bad" : s.avgDeviasi >= 0 ? "ok" : "warn"} />
        <Kpi label="Avg SPI" value={s.avgSpi.toFixed(2)} tone={s.avgSpi >= 1 ? "ok" : "warn"} />
        <Kpi label="On Schedule" value={s.onSchedule} tone="ok" />
        <Kpi label="Warning" value={s.warning} tone="warn" />
        <Kpi label="Critical Delay" value={s.critical} tone="bad" />
      </div>
      <AiInsight scope="deviasi" label="Analisa Risiko & Recovery" />
      <Panel tag="DEVIASI" title="Deviasi & SPI per Proyek" sub="klik baris untuk detail · urut paling kritis dahulu">
        <ProyekTable rows={rows} onRow={onProject} />
      </Panel>
    </>
  );
}

/* ---- KPI Direksi / Control Tower --------------------------------------- */

function barTone(status: string): "green" | "yellow" | "red" {
  return status === "Warning" ? "yellow" : status === "Critical Delay" ? "red" : "green";
}

function KpiView({ D, onProject }: { D: DashboardData; onProject: (p: ProyekMetric) => void }) {
  const k = D.kpi;
  const q = D.quality;
  const kd = D.kontraktorDeviasi.slice(0, 12);
  const kritis = [...D.proyek].sort((a, b) => a.deviasi - b.deviasi).filter((p) => p.status !== "On Schedule" && p.status !== "Lebih Cepat" && p.status !== "Sangat Cepat").slice(0, 8);
  return (
    <>
      {/* KPI utama — 4 angka kunci direksi */}
      <div className="kpi-row kpi-row-4">
        <Kpi label="On-Time Completion" value={pct(k.onTimeCompletion)} unit={`(${k.proyekOnTime}/${k.proyekTotal})`} tone={k.onTimeCompletion >= 95 ? "ok" : k.onTimeCompletion >= 80 ? "warn" : "bad"} hint="target ≥95%" />
        <Kpi label="Overall Progress" value={pct(k.overall)} tone={k.overall >= 50 ? "ok" : "warn"} />
        <Kpi label="Avg SPI" value={k.avgSpi.toFixed(2)} tone={k.avgSpi >= 1 ? "ok" : "warn"} hint="target ≥1.0" />
        <Kpi label="Avg Deviasi" value={`${k.avgDeviasi > 0 ? "+" : ""}${k.avgDeviasi.toFixed(1)}%`} tone={k.avgDeviasi < -1 ? "bad" : k.avgDeviasi >= 0 ? "ok" : "warn"} hint="target ±3%" />
      </div>

      <AiInsight scope="deviasi" label="Rekomendasi Direksi" />

      {/* Proyek paling kritis — kartu actionable */}
      <Panel tag="PRIORITAS" title={`${kritis.length} Proyek Paling Kritis`} sub="klik kartu untuk detail & rekomendasi tindakan">
        {kritis.length === 0 ? (
          <div className="tbl-empty">✓ Tidak ada proyek bermasalah.</div>
        ) : (
          <div className="attn-grid">
            {kritis.map((p) => (
              <button key={p.id} className={`attn-card ${statusTone(p.status)}`} onClick={() => onProject(p)}>
                <div className="attn-top">
                  <span className="attn-name">{p.nama}</span>
                  <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                </div>
                <div className="attn-big">{p.lateWeeks > 0 ? `Telat ${p.lateWeeks.toFixed(1)} mgg` : `Deviasi ${p.deviasi.toFixed(1)}%`}</div>
                <div className="attn-sub">Aktual {pct(p.aktual)} / target {pct(p.target)} · {p.units} unit · {p.kontraktor || "—"}</div>
                <div className="attn-cta">Klik untuk detail →</div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* Cluster — strip kartu ringkas (full width) */}
      <Panel tag="CLUSTER" title="Progres per Cluster" sub="agregat per kawasan">
        <div className="ct-cards">
          {D.clusterMetrics.map((c) => (
            <div key={c.kode} className={`ct-card ${statusTone(c.status)}`}>
              <div className="ct-head">
                <span className="ct-kode">{c.kode}</span>
                <span className="ct-nama">{c.nama}</span>
                <Pill tone={statusTone(c.status)}>{c.status}</Pill>
              </div>
              <div className="ct-bar"><Bar value={c.aktual} tick={c.target} tone={barTone(c.status)} /></div>
              <div className="ct-meta">
                <span>{c.proyek} proyek · {c.units} unit</span>
                <span>Aktual <b>{pct(c.aktual)}</b> / target {pct(c.target)} · dev <b style={{ color: c.deviasi < -1 ? "var(--bad)" : "var(--ink)" }}>{c.deviasi > 0 ? "+" : ""}{c.deviasi.toFixed(1)}</b></span>
              </div>
            </div>
          ))}
          {D.clusterMetrics.length === 0 && <div className="tbl-empty">Belum ada data.</div>}
        </div>
      </Panel>

      {/* Kontraktor — tabel ringkas + bar (full width) */}
      <Panel tag="KONTRAKTOR" title="Deviasi per Kontraktor" sub="paling kritis dahulu (top 12)">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr><th>#</th><th>Kontraktor</th><th className="num">Unit</th><th style={{ width: 180 }}>Aktual</th><th className="num">Deviasi</th><th className="num">SPI</th><th>Status</th></tr>
            </thead>
            <tbody>
              {kd.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.nama}</td>
                  <td className="num">{c.units}</td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 38, fontVariantNumeric: "tabular-nums" }}>{Math.round(c.aktual)}%</span><Bar value={c.aktual} tone={barTone(c.status)} /></div></td>
                  <td className="num" style={{ color: c.deviasi < -1 ? "var(--bad)" : "var(--ink-2)" }}>{c.deviasi > 0 ? "+" : ""}{c.deviasi.toFixed(1)}</td>
                  <td className="num">{c.spi.toFixed(2)}</td>
                  <td><Pill tone={statusTone(c.status)}>{c.status}</Pill></td>
                </tr>
              ))}
              {kd.length === 0 && <tr><td colSpan={7} className="tbl-empty">Belum ada SPK ber-kontraktor.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Mutu */}
      <Panel tag="MUTU" title="Komplain & Defect" sub="dari transaksi (Master Data → Transaksi)">
        <div className="kpi-row kpi-row-4" style={{ marginTop: 4 }}>
          <Kpi label="Komplain Open" value={q.komplainOpen} unit={`/ ${q.komplainTotal}`} tone={q.komplainOpen > 0 ? "warn" : "ok"} />
          <Kpi label="Defect Open" value={q.defectOpen} unit={`/ ${q.defectTotal}`} tone={q.defectOpen > 0 ? "warn" : "ok"} />
          <Kpi label="Defect Berulang" value={q.defectRepeat} tone={q.defectRepeat > 0 ? "bad" : "ok"} />
          <Kpi label="Total Temuan" value={q.komplainTotal + q.defectTotal} />
        </div>
      </Panel>
    </>
  );
}

/* ---- Project detail modal ---------------------------------------------- */

function rekomendasi(p: ProyekMetric): { judul: string; aksi: string[] } {
  if (p.status === "Critical Delay") {
    return {
      judul: "🔴 KRITIS — wajib tindakan segera",
      aksi: [
        "Buat Recovery Plan + Root Cause Analysis (wajib).",
        "Tambah tim/shift atau realokasi kontraktor.",
        "Eskalasi ke Manajemen; tetapkan target percepatan mingguan.",
      ],
    };
  }
  if (p.status === "Warning") {
    return {
      judul: "🟡 WARNING — pantau ketat",
      aksi: [
        "Cek tahap yang tertahan di Cek List Progress.",
        "Pastikan material & tukang cukup minggu ini.",
        "Bila deviasi membesar → siapkan Recovery Plan.",
      ],
    };
  }
  return { judul: "🟢 Aman — sesuai/di atas rencana", aksi: ["Pertahankan ritme.", "Dorong unit yang belum mulai agar terjadwal."] };
}

function ProjectModal({ p, onClose }: { p: ProyekMetric; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const r = rekomendasi(p);
  const stat = (label: string, value: ReactNode, tone?: "ok" | "warn" | "bad") => (
    <div className="pm-stat">
      <span className="pm-stat-l">{label}</span>
      <span className={`pm-stat-v ${tone ?? ""}`}>{value}</span>
    </div>
  );
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-hd">
          <h2>{p.nama}</h2>
          <span className="mh-sub">{p.clusterKode} · SPV {p.spv || "—"} · {p.kontraktor || "kontraktor —"}</span>
          <span className="mh-sp" />
          <button className="mclose" onClick={onClose}>×</button>
        </header>
        <div className="modal-bd">
          <div className="pm-grid">
            {stat("Status", <Pill tone={statusTone(p.status)}>{p.status}</Pill>)}
            {stat("Unit", p.units)}
            {stat("Minggu berjalan", `~${p.week}`)}
            {stat("Aktual", pct(p.aktual), p.aktual >= p.target ? "ok" : undefined)}
            {stat("Target", pct(p.target))}
            {stat("Deviasi", `${p.deviasi > 0 ? "+" : ""}${p.deviasi.toFixed(1)}%`, p.deviasi < -1 ? "bad" : p.deviasi >= 1 ? "ok" : undefined)}
            {stat("SPI", p.spi.toFixed(2), p.spi >= 1 ? "ok" : "warn")}
            {stat("Keterlambatan", p.lateWeeks > 0 ? `${p.lateWeeks.toFixed(1)} mgg` : "—", p.lateWeeks > 0 ? "bad" : "ok")}
          </div>
          <div className={`pm-reco ${statusTone(p.status)}`}>
            <div className="pm-reco-h">{r.judul}</div>
            <ul>{r.aksi.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}
