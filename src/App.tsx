import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { DashboardData, Project, Summary } from "./types";
import { api } from "./api/client";
import { useDashboard } from "./hooks/useDashboard";
import { useScale } from "./hooks/useScale";
import { useLogo } from "./hooks/useLogo";
import { Clock } from "./components/Clock";
import { Icon } from "./components/Icon";
import {
  AiDecisionPanel,
  ContractorPanel,
  ComplaintPanel,
  KpiRow,
  ProgressPanel,
  ProjectPanel,
  QualityPanel,
} from "./components/panels";
import { FOCUS_META, ProjectDetail } from "./components/focus";
import { useAuth } from "./auth/AuthContext";
import { Login } from "./components/Login";
import { MasterData } from "./master/MasterData";
import { ProsesBisnis } from "./components/ProsesBisnis";
import { ProgressChecklist } from "./components/ProgressChecklist";

interface TabDef {
  id: string;
  label: string;
  icon: string;
  alert?: boolean;
}

const TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "project", label: "Proyek", icon: "building" },
  { id: "contractor", label: "Kontraktor", icon: "truck" },
  { id: "quality", label: "Mutu & Defect", icon: "shield" },
  { id: "complaint", label: "Komplain", icon: "alert", alert: true },
  { id: "site", label: "Site & Handover", icon: "home" },
  { id: "ai", label: "AI & Decision", icon: "cpu" },
  { id: "kpi", label: "KPI", icon: "trend" },
  { id: "triggers", label: "Early Warning", icon: "filter" },
  { id: "checklist", label: "Cek List Progress", icon: "grid" },
  { id: "kurva", label: "Kurva S", icon: "trend" },
  { id: "deviasi", label: "Deviasi", icon: "alert" },
  { id: "proses", label: "Proses Bisnis", icon: "rec" },
  { id: "master", label: "Master Data", icon: "db" },
];

type Modal = { kind: "focus"; key: string } | { kind: "project"; p: Project };

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
  if (status === "out") {
    return <Login />;
  }
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
  const [filter, setFilter] = useState<string>("all");
  const [modal, setModal] = useState<Modal | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("gp_tab", tab);
    } catch {
      /* ignore storage errors */
    }
  }, [tab]);

  // Filtered data set (by project) — derived KPIs recomputed client-side.
  const data: DashboardData = useMemo(() => {
    if (filter === "all") return D;
    const proj = D.projects.find((p) => p.id === filter);
    const projects = D.projects.filter((p) => p.id === filter);
    const lastWord = proj ? proj.name.split(" ").slice(-1)[0].toLowerCase() : "";
    const matchUnit = (u: string) => proj != null && u.toLowerCase().includes(lastWord);
    const complaints = D.complaints.filter((c) => matchUnit(c.unit));
    const siteReadiness = D.siteReadiness.filter((s) => proj != null && s.project === proj.name);
    const totalUnits = projects.reduce((sum, p) => sum + p.units, 0) || 1;
    const overall = Math.round(projects.reduce((sum, p) => sum + p.actual * p.units, 0) / totalUnits);
    const summary: Summary = {
      ...D.summary,
      totalProject: projects.length,
      totalUnits,
      overall,
      onTrack: projects.filter((p) => p.status === "green").length,
      atRisk: projects.filter((p) => p.status === "yellow").length,
      offTrack: projects.filter((p) => p.status === "red").length,
      critical: complaints.filter((c) => c.level === "critical").length,
    };
    return {
      ...D,
      projects,
      complaints,
      siteReadiness: siteReadiness.length ? siteReadiness : D.siteReadiness,
      summary,
    };
  }, [filter, D]);

  const openFocus = (key: string) => setModal({ kind: "focus", key });
  const openProject = (p: Project) => setModal({ kind: "project", p });

  return (
    <>
      <Header logo={logo} onLogoDrop={onLogoDrop} />
      <Tabs tab={tab} setTab={setTab} data={D} filter={filter} setFilter={setFilter} critical={data.summary.critical} />
      <div className="body">
        {tab === "master" ? (
          <MasterData />
        ) : tab === "proses" ? (
          <ProsesBisnis />
        ) : tab === "checklist" ? (
          <ProgressChecklist data={D} />
        ) : tab === "overview" ? (
          <Overview data={data} openFocus={openFocus} openProject={openProject} />
        ) : (
          <FocusBody tabKey={tab} data={data} />
        )}
      </div>
      {modal && <ModalView modal={modal} data={data} onClose={() => setModal(null)} />}
    </>
  );
}

function Header({ logo, onLogoDrop }: { logo: string; onLogoDrop: (e: React.DragEvent) => void }) {
  return (
    <header className="hdr">
      <div
        className="hdr-logo"
        onDrop={onLogoDrop}
        onDragOver={(e) => e.preventDefault()}
        title="Drag & drop logo Greenpark"
      >
        {logo ? (
          <img src={logo} alt="logo" />
        ) : (
          <span>
            Drop
            <br />
            Logo
          </span>
        )}
      </div>
      <div className="hdr-titles">
        <h1>DASHBOARD TEKNIK GREENPARK GROUP</h1>
        <div className="sub">One Page CEO Technical Control Dashboard — Reputation Guard System</div>
        <div className="tag">ONE TEAM · ONE SYSTEM · ONE DASHBOARD · ONE GOAL</div>
      </div>
      <span className="hdr-spacer" />
      <div className="hdr-meta">
        <div className="legend">
          <span className="lg">
            <span className="dot ok" />
            On Track
          </span>
          <span className="lg">
            <span className="dot warn" />
            At Risk
          </span>
          <span className="lg">
            <span className="dot bad" />
            Off Track
          </span>
        </div>
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

function Tabs({
  tab,
  setTab,
  data,
  filter,
  setFilter,
  critical,
}: {
  tab: string;
  setTab: (t: string) => void;
  data: DashboardData;
  filter: string;
  setFilter: (f: string) => void;
  critical: number;
}) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
          <Icon name={t.icon} size={15} />
          {t.label}
          {t.id === "complaint" && <span className="cnt alert">{critical}</span>}
        </button>
      ))}
      <span className="tabs-spacer" />
      <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)} title="Filter proyek">
        <option value="all">▾ Semua Proyek</option>
        {data.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </nav>
  );
}

function Overview({
  data,
  openFocus,
  openProject,
}: {
  data: DashboardData;
  openFocus: (key: string) => void;
  openProject: (p: Project) => void;
}) {
  return (
    <>
      <KpiRow s={data.summary} />
      <div className="grid">
        <ProgressPanel trend={data.progressTrend} onExpand={() => openFocus("project")} />
        <ProjectPanel projects={data.projects} onExpand={() => openFocus("project")} onRow={openProject} />
        <ContractorPanel contractors={data.contractors} meta={data.vendorStatusMap} onExpand={() => openFocus("contractor")} />
        <QualityPanel q={data.quality} onExpand={() => openFocus("quality")} />
        <ComplaintPanel complaints={data.complaints} meta={data.complaintMap} onExpand={() => openFocus("complaint")} />
        <AiDecisionPanel insights={data.aiInsights} decisions={data.decisions} onExpand={() => openFocus("ai")} />
      </div>
    </>
  );
}

function FocusBody({ tabKey, data }: { tabKey: string; data: DashboardData }) {
  const meta = FOCUS_META[tabKey];
  if (!meta) return null;
  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <header className="panel-hd">
        <span className="ptag">{meta.tag}</span>
        <span className="ptitle">{meta.title}</span>
        <span className="psub">· {meta.sub}</span>
      </header>
      <div className="panel-bd scroll" style={{ gap: 18 }}>
        {meta.render(data)}
      </div>
    </div>
  );
}

function ModalView({ modal, data, onClose }: { modal: Modal; data: DashboardData; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  let title: string;
  let sub: string;
  let content: ReactNode;
  if (modal.kind === "project") {
    title = modal.p.name;
    sub = "Project deep-dive · " + modal.p.contractor;
    content = <ProjectDetail p={modal.p} />;
  } else {
    const m = FOCUS_META[modal.key];
    title = m.title;
    sub = m.sub;
    content = m.render(data);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-hd">
          <h2>{title}</h2>
          <span className="mh-sub">{sub}</span>
          <span className="mh-sp" />
          <button className="mclose" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-bd">{content}</div>
      </div>
    </div>
  );
}
