import type {
  AIInsight,
  Complaint,
  Contractor,
  Decision,
  HandoverReadiness,
  MetaItem,
  Project,
  ProgressTrend,
  Quality,
  SiteReadiness,
  Summary,
  Tone,
} from "../types";
import { statusVar } from "../lib/status";
import { Bar, Kpi, Panel, Pill, Stat, StatusPill } from "./ui";
import { Icon } from "./Icon";
import { ProgressChart } from "./ProgressChart";

/* A. Executive KPI row -------------------------------------------------- */
export function KpiRow({ s }: { s: Summary }) {
  return (
    <div className="kpi-row">
      <Kpi label="Total Project" value={s.totalProject} unit="aktif" />
      <Kpi label="Unit On Progress" value={s.totalUnits} unit="unit" />
      <Kpi label="Overall Progress" value={s.overall + "%"} tone="warn" delta="vs plan" deltaDir="down" />
      <Kpi label="On Track" value={s.onTrack} unit="proyek" tone="ok" />
      <Kpi label="At Risk" value={s.atRisk} unit="proyek" tone="warn" />
      <Kpi label="Off Track" value={s.offTrack} unit="proyek" tone="bad" />
      <Kpi label="Quality Score" value={s.qualityScore + "%"} tone="warn" delta="QC pass rate" />
      <Kpi label="Complaint Risk" value={s.complaintRisk} tone="bad" delta={s.critical + " critical aktif"} />
    </div>
  );
}

/* Progress chart panel -------------------------------------------------- */
export function ProgressPanel({ trend, onExpand }: { trend: ProgressTrend; onExpand: () => void }) {
  return (
    <Panel tag="CHART" title="Progress Control" sub="Rencana vs Realisasi" onExpand={onExpand}>
      <div className="chart-wrap">
        <div className="chart-legend">
          <span className="l-plan">
            <i />
            Baseline / Plan
          </span>
          <span className="l-act">
            <i />
            Actual
          </span>
        </div>
        <ProgressChart trend={trend} />
      </div>
    </Panel>
  );
}

/* B. Project Risk Table ------------------------------------------------- */
export function ProjectPanel({
  projects,
  onExpand,
  onRow,
}: {
  projects: Project[];
  onExpand: () => void;
  onRow: (p: Project) => void;
}) {
  return (
    <Panel tag="PROYEK" title="Project Risk Table" sub={`${projects.length} proyek`} onExpand={onExpand}>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>Proyek</th>
              <th style={{ textAlign: "right" }}>Progress</th>
              <th style={{ width: 96 }}>Capaian</th>
              <th style={{ textAlign: "right" }}>Gap</th>
              <th style={{ textAlign: "right" }}>Delay</th>
              <th>5 Bln</th>
              <th>Status</th>
              <th>SPV</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="clickable" onClick={() => onRow(p)}>
                <td className="row-accent" style={{ background: `var(--${statusVar(p.status)})` }}></td>
                <td className="name">
                  {p.name}
                  <div style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500 }}>{p.contractor}</div>
                </td>
                <td className="num">{p.actual}%</td>
                <td>
                  <Bar value={p.actual} tick={p.baseline} tone={p.status} />
                </td>
                <td className="num" style={{ color: p.gap < 0 ? "var(--bad)" : "var(--green-700)", fontWeight: 600 }}>
                  {p.gap > 0 ? "+" : ""}
                  {p.gap}%
                </td>
                <td className="num">{p.delay}h</td>
                <td className="num">
                  {p.day}
                  <span style={{ color: "var(--ink-3)" }}>/{p.target}</span>
                </td>
                <td>
                  <StatusPill status={p.status} />
                </td>
                <td>{p.spv}</td>
                <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{p.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* C. Contractor Ranking ------------------------------------------------- */
export function ContractorPanel({
  contractors,
  meta,
  onExpand,
}: {
  contractors: Contractor[];
  meta: Record<string, MetaItem>;
  onExpand: () => void;
}) {
  return (
    <Panel tag="VENDOR" title="Contractor Ranking" sub="berbasis data" onExpand={onExpand}>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Kontraktor</th>
              <th style={{ textAlign: "right" }}>Unit</th>
              <th style={{ textAlign: "right" }}>Pass</th>
              <th style={{ textAlign: "right" }}>Delay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.name}>
                <td className="num" style={{ fontWeight: 700, color: "var(--navy-700)" }}>
                  {c.rank}
                </td>
                <td className="name">{c.name}</td>
                <td className="num">{c.units}</td>
                <td
                  className="num"
                  style={{ color: c.passRate >= 90 ? "var(--green-700)" : c.passRate >= 80 ? "var(--warn)" : "var(--bad)" }}
                >
                  {c.passRate}%
                </td>
                <td className="num">{c.delayFreq}</td>
                <td>
                  <Pill tone={meta[c.status].tone}>{meta[c.status].label}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* D. Quality & Defect --------------------------------------------------- */
export function QualityPanel({ q, onExpand }: { q: Quality; onExpand: () => void }) {
  const maxCat = Math.max(...q.categories.map((c) => c.count));
  return (
    <Panel tag="MUTU" title="Quality & Defect" sub="zero defect" accent="var(--green-700)" onExpand={onExpand}>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 11 }}>
        <Stat label="QC Pass" value={q.passRate + "%"} tone="warn" />
        <Stat label="Open" value={q.open} tone="bad" />
        <Stat label="Repeat" value={q.repeat} tone="warn" />
        <Stat label="Aging" value={q.agingAvg + "h"} tone="warn" />
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--ink-3)",
          textTransform: "uppercase",
          letterSpacing: ".04em",
          marginBottom: 7,
        }}
      >
        Top Defect Category
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {q.categories.map((c) => (
          <div className="catbar" key={c.name}>
            <span className="cn">{c.name}</span>
            <div className="ctrk">
              <i style={{ width: (c.count / maxCat) * 100 + "%" }} />
            </div>
            <span className="cv">{c.count}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* E. Complaint Escalation ----------------------------------------------- */
export function ComplaintPanel({
  complaints,
  meta,
  onExpand,
}: {
  complaints: Complaint[];
  meta: Record<string, MetaItem>;
  onExpand: () => void;
}) {
  const cnt = { critical: 0, major: 0, minor: 0 } as Record<string, number>;
  complaints.forEach((c) => (cnt[c.level] = (cnt[c.level] ?? 0) + 1));
  const slaTone: Record<string, Tone> = { ok: "green", due: "yellow", overdue: "red" };
  const slaLabel: Record<string, string> = { ok: "On-time", due: "Due", overdue: "Overdue" };
  const riskTone: Record<string, Tone> = { high: "red", med: "orange", low: "neutral" };
  return (
    <Panel tag="KOMPLAIN" title="Complaint Escalation" sub="zero complaint" accent="var(--bad)" onExpand={onExpand}>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 10 }}>
        <Stat label="Critical" value={cnt.critical} tone="bad" />
        <Stat label="Major" value={cnt.major} tone="warn" />
        <Stat label="Minor" value={cnt.minor} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Issue</th>
              <th>Lvl</th>
              <th style={{ textAlign: "right" }}>Aging</th>
              <th>Field SLA</th>
              <th>Publik</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td className="name" style={{ whiteSpace: "nowrap" }}>
                  {c.unit}
                </td>
                <td style={{ fontSize: 11 }}>{c.issue}</td>
                <td>
                  <Pill tone={meta[c.level].tone} dot={false}>
                    {meta[c.level].label}
                  </Pill>
                </td>
                <td
                  className="num"
                  style={{
                    color: c.aging > 5 ? "var(--bad)" : c.aging > 3 ? "var(--warn)" : "var(--ink-2)",
                    fontWeight: 600,
                  }}
                >
                  {c.aging}h
                </td>
                <td>
                  <Pill tone={slaTone[c.slaField]} dot={false}>
                    {slaLabel[c.slaField]}
                  </Pill>
                </td>
                <td>
                  <Pill tone={riskTone[c.publicRisk]} dot={false}>
                    {c.publicRisk === "high" ? "Tinggi" : c.publicRisk === "med" ? "Sedang" : "Rendah"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* F. Site & Handover Readiness ------------------------------------------ */
export function SitePanel({
  site,
  handover,
  onExpand,
}: {
  site: SiteReadiness[];
  handover: HandoverReadiness[];
  onExpand: () => void;
}) {
  const sectionTitle = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--ink-3)",
    textTransform: "uppercase" as const,
    letterSpacing: ".04em",
    marginBottom: 6,
  };
  return (
    <Panel tag="SITE" title="Site & Handover Readiness" sub="trust guard" onExpand={onExpand}>
      <div style={sectionTitle}>Site Readiness</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
        {site.map((sr) => (
          <div
            key={sr.project}
            style={{ display: "grid", gridTemplateColumns: "1fr 54px 1fr 40px", alignItems: "center", gap: 9 }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>{sr.project}</span>
            <Pill tone="neutral" dot={false}>
              {sr.window}
            </Pill>
            <Bar value={sr.score} tone={sr.status} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                textAlign: "right",
                color: `var(--${statusVar(sr.status)})`,
              }}
            >
              {sr.score}
            </span>
          </div>
        ))}
      </div>
      <div style={sectionTitle}>Handover Readiness</div>
      <div style={{ display: "flex", gap: 8 }}>
        {handover.map((h) => (
          <Stat
            key={h.unit}
            className="handover-stat"
            style={{ flex: 1, borderTop: `3px solid var(--${statusVar(h.status)})` }}
            label={`${h.unit} · ${h.window}`}
            value={h.score}
            tone={statusVar(h.status) === "ok" ? "ok" : statusVar(h.status) === "warn" ? "warn" : "bad"}
            valueStyle={{ fontSize: 19 }}
          />
        ))}
      </div>
    </Panel>
  );
}

/* G + H. AI Insights & Critical Decision -------------------------------- */
export function AiDecisionPanel({
  insights,
  decisions,
  onExpand,
}: {
  insights: AIInsight[];
  decisions: Decision[];
  onExpand: () => void;
}) {
  return (
    <Panel tag="AI" title="AI Insights & Decision" sub="apa yang diwaspadai hari ini" accent="var(--navy-600)" onExpand={onExpand}>
      <div className="ai-list" style={{ maxHeight: "52%", flex: "0 1 auto" }}>
        {insights.slice(0, 4).map((a, i) => (
          <div className={`ai-card ${a.tone}`} key={i}>
            <span className="ai-ico">
              <Icon name={a.icon} size={15} />
            </span>
            <div className="ai-tx">
              <div className="ai-ty">{a.type}</div>
              <div className="ai-ms">{a.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--ink-3)",
          textTransform: "uppercase",
          letterSpacing: ".04em",
          margin: "11px 0 7px",
        }}
      >
        Critical Decision Box
      </div>
      <div className="dec-box" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {decisions.map((d, i) => (
          <div className={`dec ${d.tone}`} key={i}>
            <span className="drole">{d.role}</span>
            <span className="dtx">{d.text}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
