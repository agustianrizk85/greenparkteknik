import type { ReactNode } from "react";
import type { DashboardData, Project, Status, Tone } from "../types";
import { STATUS_LABEL, statusVar, toneClass } from "../lib/status";
import { Bar, Pill, Stat, StatusPill } from "./ui";
import { Icon } from "./Icon";
import { ProgressChart } from "./ProgressChart";
import { deviationStatus, forecastDelayWeeks, kurvaSeries, latestPerUnit, spi } from "../lib/kurvaS";

/* ---- Single project deep-dive ----------------------------------------- */
export function ProjectDetail({ p }: { p: Project }) {
  const fields: [string, ReactNode][] = [
    ["Total Unit", p.units],
    ["Baseline Progress", p.baseline + "%"],
    ["Actual Progress", p.actual + "%"],
    ["Gap Progress", (p.gap > 0 ? "+" : "") + p.gap + "%"],
    ["Delay Days", p.delay + " hari"],
    ["Milestone 5 Bulan", p.day + " / " + p.target + " hari"],
    ["Kontraktor PIC", p.contractor],
    ["SPV PIC", p.spv],
    ["Recovery Plan", p.recovery],
    ["Decision Needed", p.decision],
  ];
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StatusPill status={p.status} />
        <span className="note">Status terhadap target pembangunan rumah 5 bulan (150 hari).</span>
      </div>
      <div className="cards-row">
        {fields.map(([k, v]) => (
          <Stat key={k} label={k} value={v} valueStyle={{ fontSize: 18 }} />
        ))}
      </div>
      <div>
        <div className="section-title">Milestone 5 Bulan</div>
        <Bar value={p.day} max={p.target} tone={p.status} />
        <div className="note" style={{ marginTop: 6 }}>
          Hari ke-{p.day} dari 150. {p.day > 120 ? "Mendekati batas — perlu kepastian recovery." : "Masih dalam jalur."}
        </div>
      </div>
    </>
  );
}

/* ---- Projects focus --------------------------------------------------- */
function ProjectsFocus({ d }: { d: DashboardData }) {
  return (
    <>
      <div className="section-title">Project Progress Control — seluruh proyek aktif</div>
      <table className="big">
        <thead>
          <tr>
            <th>Proyek</th>
            <th>Unit</th>
            <th>Baseline</th>
            <th>Actual</th>
            <th>Gap</th>
            <th>Delay</th>
            <th>5 Bln</th>
            <th>Status</th>
            <th>Kontraktor</th>
            <th>SPV</th>
            <th>Recovery</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {d.projects.map((p) => (
            <tr key={p.id}>
              <td className="name">{p.name}</td>
              <td className="num">{p.units}</td>
              <td className="num">{p.baseline}%</td>
              <td className="num">{p.actual}%</td>
              <td className="num" style={{ color: p.gap < 0 ? "var(--bad)" : "var(--green-700)" }}>
                {p.gap > 0 ? "+" : ""}
                {p.gap}%
              </td>
              <td className="num">{p.delay}h</td>
              <td className="num">
                {p.day}/{p.target}
              </td>
              <td>
                <StatusPill status={p.status} />
              </td>
              <td>{p.contractor}</td>
              <td>{p.spv}</td>
              <td style={{ fontSize: 12 }}>{p.recovery}</td>
              <td style={{ fontSize: 12 }}>{p.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---- Contractors focus ------------------------------------------------ */
function ContractorsFocus({ d }: { d: DashboardData }) {
  const borderTone = (t: Tone) =>
    t === "neutral" ? "ink-3" : t === "green" ? "ok" : t === "yellow" ? "warn" : t === "orange" ? "orange" : "bad";
  return (
    <>
      <div className="section-title">Contractor Performance Control</div>
      <table className="big">
        <thead>
          <tr>
            <th>#</th>
            <th>Kontraktor</th>
            <th>Unit</th>
            <th>Commitment</th>
            <th>Delay Freq</th>
            <th>Pass Rate</th>
            <th>Repeat Defect</th>
            <th>Take Over</th>
            <th>Retensi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {d.contractors.map((c) => (
            <tr key={c.name}>
              <td className="num" style={{ fontWeight: 700 }}>
                {c.rank}
              </td>
              <td className="name">{c.name}</td>
              <td className="num">{c.units}</td>
              <td className="num">{c.commitment}%</td>
              <td className="num">{c.delayFreq}</td>
              <td className="num">{c.passRate}%</td>
              <td className="num">{c.repeat}</td>
              <td className="num">{c.takeover}</td>
              <td className="num">{c.retensi ? c.retensi + "%" : "—"}</td>
              <td>
                <Pill tone={d.vendorStatusMap[c.status].tone}>{d.vendorStatusMap[c.status].label}</Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <div className="section-title">Klasifikasi Status Vendor</div>
        <div className="cards-row">
          {d.vendorStatusMeta.map((m) => (
            <div className="stat" key={m.key} style={{ borderLeft: `3px solid var(--${borderTone(m.tone)})` }}>
              <Pill tone={m.tone}>{m.label}</Pill>
              <span className="note" style={{ marginTop: 5 }}>
                {m.note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- Quality focus ---------------------------------------------------- */
function QualityFocus({ d }: { d: DashboardData }) {
  const q = d.quality;
  const max = Math.max(...q.categories.map((x) => x.count));
  return (
    <>
      <div className="section-title">Quality & Defect Control</div>
      <div className="cards-row">
        <Stat label="QC Pass Rate" value={q.passRate + "%"} tone="warn" />
        <Stat label="Open Defect" value={q.open} tone="bad" />
        <Stat label="Closed Defect" value={q.closed} tone="ok" />
        <Stat label="Repeat Defect" value={q.repeat + " (" + q.repeatRate + "%)"} tone="warn" />
        <Stat label="Avg Aging" value={q.agingAvg + " hari"} tone="warn" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="section-title">Top Defect Category</div>
          {q.categories.map((c) => (
            <div className="catbar" key={c.name}>
              <span className="cn">{c.name}</span>
              <div className="ctrk">
                <i style={{ width: (c.count / max) * 100 + "%" }} />
              </div>
              <span className="cv">{c.count}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="section-title">Unit High Risk</div>
          <table className="big">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Issue</th>
                <th>Aging</th>
              </tr>
            </thead>
            <tbody>
              {q.highRisk.map((u) => (
                <tr key={u.unit}>
                  <td className="name">{u.unit}</td>
                  <td>{u.issue}</td>
                  <td className="num" style={{ color: u.aging > 5 ? "var(--bad)" : "var(--warn)" }}>
                    {u.aging}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="note">
        Prinsip: defect selesai bukan ketika tukang sudah kerja, tetapi ketika QC memvalidasi dan konsumen tidak menerima
        masalah yang sama.
      </div>
    </>
  );
}

/* ---- Complaint focus -------------------------------------------------- */
function ComplaintFocus({ d }: { d: DashboardData }) {
  const slaTone: Record<string, Tone> = { ok: "green", due: "yellow", overdue: "red" };
  const slaLabel: Record<string, string> = { ok: "On-time", due: "Due", overdue: "Overdue" };
  const riskMap: Record<string, [Tone, string]> = {
    high: ["red", "Tinggi"],
    med: ["orange", "Sedang"],
    low: ["neutral", "Rendah"],
  };
  return (
    <>
      <div className="section-title">Complaint Prevention & Escalation</div>
      <table className="big">
        <thead>
          <tr>
            <th>ID</th>
            <th>Unit</th>
            <th>Issue</th>
            <th>Level</th>
            <th>Owner</th>
            <th>Aging</th>
            <th>Field SLA</th>
            <th>Public Risk</th>
            <th>Next Communication</th>
          </tr>
        </thead>
        <tbody>
          {d.complaints.map((c) => (
            <tr key={c.id}>
              <td className="num">{c.id}</td>
              <td className="name">{c.unit}</td>
              <td>{c.issue}</td>
              <td>
                <Pill tone={d.complaintMap[c.level].tone} dot={false}>
                  {d.complaintMap[c.level].label}
                </Pill>
              </td>
              <td>{c.owner}</td>
              <td className="num" style={{ color: c.aging > 5 ? "var(--bad)" : c.aging > 3 ? "var(--warn)" : "var(--ink-2)" }}>
                {c.aging}h
              </td>
              <td>
                <Pill tone={slaTone[c.slaField]} dot={false}>
                  {slaLabel[c.slaField]}
                </Pill>
              </td>
              <td>
                <Pill tone={riskMap[c.publicRisk][0]} dot={false}>
                  {riskMap[c.publicRisk][1]}
                </Pill>
              </td>
              <td style={{ fontSize: 12 }}>{c.next}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <div className="section-title">Klasifikasi & SLA</div>
        <div className="cards-row">
          {d.complaintMeta.map((m) => (
            <div
              className="stat"
              key={m.key}
              style={{ borderLeft: `3px solid var(--${m.tone === "red" ? "bad" : m.tone === "orange" ? "orange" : "warn"})` }}
            >
              <Pill tone={m.tone}>{m.label}</Pill>
              <span className="note" style={{ marginTop: 5 }}>
                {m.sla}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- Site focus ------------------------------------------------------- */
function SiteFocus({ d }: { d: DashboardData }) {
  return (
    <>
      <div className="section-title">Site Readiness & Handover Readiness</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <table className="big">
          <thead>
            <tr>
              <th>Proyek</th>
              <th>Window</th>
              <th>Score</th>
              <th>Status</th>
              <th>Gap Utama</th>
            </tr>
          </thead>
          <tbody>
            {d.siteReadiness.map((s) => (
              <tr key={s.project}>
                <td className="name">{s.project}</td>
                <td className="num">{s.window}</td>
                <td className="num" style={{ color: `var(--${statusVar(s.status)})` }}>
                  {s.score}
                </td>
                <td>
                  <StatusPill status={s.status} />
                </td>
                <td style={{ fontSize: 12 }}>{s.gaps.length ? s.gaps.join(" · ") : "Tidak ada gap kritis"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="big">
          <thead>
            <tr>
              <th>Unit (Handover)</th>
              <th>Window</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {d.handoverReadiness.map((h) => (
              <tr key={h.unit}>
                <td className="name">{h.unit}</td>
                <td className="num">{h.window}</td>
                <td className="num">{h.score}</td>
                <td>
                  <StatusPill status={h.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="section-title">Checklist Site Readiness</div>
        <div className="cards-row">
          {d.siteChecklist.map((c, i) => (
            <div className="stat" key={i} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--green-700)", fontWeight: 600 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- AI + Decisions focus --------------------------------------------- */
function AiFocus({ d }: { d: DashboardData }) {
  return (
    <>
      <div className="section-title">AI Insights & Recommendation</div>
      <div className="cards-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {d.aiInsights.map((a, i) => (
          <div className={`ai-card ${a.tone}`} key={i}>
            <span className="ai-ico">
              <Icon name={a.icon} size={16} />
            </span>
            <div className="ai-tx">
              <div className="ai-ty">{a.type}</div>
              <div className="ai-ms" style={{ fontSize: 13 }}>
                {a.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="section-title">Critical Decision Box</div>
      <div className="cards-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {d.decisions.map((dc, i) => (
          <div className={`dec ${dc.tone}`} key={i}>
            <span className="drole">{dc.role}</span>
            <span className="dtx" style={{ fontSize: 13 }}>
              {dc.text}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---- KPI reference table ---------------------------------------------- */
function KpiFocus({ d }: { d: DashboardData }) {
  return (
    <>
      <div className="section-title">Tabel KPI Dashboard Teknik — 15 indikator</div>
      <table className="big">
        <thead>
          <tr>
            <th>No</th>
            <th>KPI</th>
            <th>Definisi</th>
            <th>PIC</th>
            <th>Update</th>
            <th>Hijau</th>
            <th>Kuning</th>
            <th>Merah</th>
            <th>Nilai Kini</th>
          </tr>
        </thead>
        <tbody>
          {d.kpiTable.map((k) => (
            <tr key={k.no}>
              <td className="num">{k.no}</td>
              <td className="name">{k.kpi}</td>
              <td style={{ fontSize: 12 }}>{k.def}</td>
              <td>{k.pic}</td>
              <td>{k.upd}</td>
              <td className="num" style={{ color: "var(--green-700)" }}>
                {k.green}
              </td>
              <td className="num" style={{ color: "var(--warn)" }}>
                {k.yellow}
              </td>
              <td className="num" style={{ color: "var(--bad)" }}>
                {k.red}
              </td>
              <td>
                <Pill tone={toneClass(k.state)} dot={false}>
                  {k.val}
                </Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---- Early warning triggers ------------------------------------------- */
function TriggerFocus({ d }: { d: DashboardData }) {
  return (
    <>
      <div className="section-title">Early Warning Trigger</div>
      <table className="big">
        <thead>
          <tr>
            <th>Kondisi</th>
            <th>Ambang Batas</th>
            <th>Status</th>
            <th>PIC</th>
            <th>Tindakan Wajib</th>
            <th>Eskalasi</th>
          </tr>
        </thead>
        <tbody>
          {d.triggers.map((t, i) => (
            <tr key={i}>
              <td className="name">{t.cond}</td>
              <td className="num">{t.thr}</td>
              <td>
                <Pill tone={toneClass(t.status)} dot={false}>
                  {t.status === "crisis" ? "Crisis" : STATUS_LABEL[t.status as Status]}
                </Pill>
              </td>
              <td>{t.pic}</td>
              <td style={{ fontSize: 12 }}>{t.act}</td>
              <td>{t.esc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---- Kurva S focus ----------------------------------------------------- */
function KurvaSFocus({ d }: { d: DashboardData }) {
  const series = kurvaSeries(d.kurvaWeekly, d.unitWeeklyProgress);
  const trend = { weeks: series.labels, plan: series.plan, actual: series.actual };
  const weeks = [...d.kurvaWeekly].sort((a, b) => a.week - b.week);
  const items = [...d.workItems].sort((a, b) => a.no - b.no);
  return (
    <>
      <div className="section-title">Kurva S — Rencana vs Realisasi (baseline 20 minggu)</div>
      <ProgressChart trend={trend} />
      <div className="note" style={{ marginTop: 4 }}>
        Garis putus-putus = RENCANA kumulatif (bobot mingguan). Garis hijau = REALISASI rata-rata unit.
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>Master Bobot Pekerjaan</div>
      <table className="big">
        <thead><tr><th>No</th><th>Item Pekerjaan</th><th>Bobot %</th></tr></thead>
        <tbody>
          {items.map((w) => (
            <tr key={w.id}><td>{w.no}</td><td>{w.name}</td><td>{w.weight.toFixed(2)}%</td></tr>
          ))}
        </tbody>
      </table>

      <div className="section-title" style={{ marginTop: 16 }}>Bobot Mingguan (Kurva S)</div>
      <table className="big">
        <thead><tr><th>Minggu</th><th>Bobot %</th><th>Kumulatif %</th></tr></thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.id}><td>M{w.week}</td><td>{w.weight.toFixed(3)}%</td><td>{w.cumulative.toFixed(2)}%</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ---- Deviasi focus ----------------------------------------------------- */
function DeviasiFocus({ d }: { d: DashboardData }) {
  const latest = latestPerUnit(d.unitWeeklyProgress);
  const unitName = new Map(d.progressUnits.map((u) => [u.id, `${u.project} · ${u.blok}`]));
  const byUnitRows = (id: string) => d.unitWeeklyProgress.filter((r) => r.unitId === id);
  const rows = Array.from(latest.values()).sort((a, b) => a.actual - b.actual - (b.target - a.target));
  if (rows.length === 0) {
    return <div className="note">Belum ada data progress mingguan unit. Input di Master Data → Progress Mingguan Unit.</div>;
  }
  return (
    <>
      <div className="section-title">Monitoring Deviasi per Unit (minggu terbaru)</div>
      <table className="big">
        <thead>
          <tr>
            <th>Unit</th><th>Minggu</th><th>Target %</th><th>Aktual %</th><th>Deviasi</th>
            <th>Status</th><th>SPI</th><th>Forecast Telat</th><th>Recovery</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dev = r.actual - r.target;
            const st = deviationStatus(dev);
            const s = spi(r.actual, r.target);
            const fc = forecastDelayWeeks(byUnitRows(r.unitId));
            return (
              <tr key={r.id}>
                <td>{unitName.get(r.unitId) ?? r.unitId}</td>
                <td>M{r.week}</td>
                <td>{r.target.toFixed(1)}</td>
                <td>{r.actual.toFixed(1)}</td>
                <td style={{ fontWeight: 600 }}>{(dev > 0 ? "+" : "") + dev.toFixed(1)}%</td>
                <td><Pill tone={st.tone}>{st.label}</Pill></td>
                <td>{s.toFixed(2)}</td>
                <td>{fc > 0 ? `${fc} mgg` : "—"}</td>
                <td>{dev <= -5 ? <Pill tone="red">Wajib Recovery</Pill> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="note" style={{ marginTop: 8 }}>
        Deviasi = Aktual − Target kumulatif. SPI = Aktual ÷ Target (&gt;1 lebih cepat). Deviasi ≤ −5% wajib Recovery Plan + Root Cause.
      </div>
    </>
  );
}

export interface FocusEntry {
  tag: string;
  title: string;
  sub: string;
  render: (d: DashboardData) => ReactNode;
}

export const FOCUS_META: Record<string, FocusEntry> = {
  project: { tag: "PANEL B", title: "Project Progress Control", sub: "kendali proyek", render: (d) => <ProjectsFocus d={d} /> },
  contractor: { tag: "PANEL C", title: "Contractor Performance", sub: "vendor accountable", render: (d) => <ContractorsFocus d={d} /> },
  quality: { tag: "PANEL D", title: "Quality & Defect Control", sub: "zero defect", render: (d) => <QualityFocus d={d} /> },
  complaint: { tag: "PANEL E", title: "Complaint Prevention & Escalation", sub: "zero complaint", render: (d) => <ComplaintFocus d={d} /> },
  site: { tag: "PANEL F", title: "Site & Handover Readiness", sub: "reputation guard", render: (d) => <SiteFocus d={d} /> },
  ai: { tag: "PANEL G+H", title: "AI Insights & Critical Decision", sub: "intelligence & decision", render: (d) => <AiFocus d={d} /> },
  kpi: { tag: "SECTION 6", title: "KPI Dashboard Teknik", sub: "definisi & ambang batas", render: (d) => <KpiFocus d={d} /> },
  triggers: { tag: "SECTION 7", title: "Early Warning Trigger", sub: "alarm otomatis", render: (d) => <TriggerFocus d={d} /> },
  kurva: { tag: "KURVA S", title: "Kurva S — Pengendalian Progres", sub: "rencana vs realisasi", render: (d) => <KurvaSFocus d={d} /> },
  deviasi: { tag: "DEVIASI", title: "Monitoring Deviasi & Forecast", sub: "SPI · recovery", render: (d) => <DeviasiFocus d={d} /> },
  chart: { tag: "PANEL B", title: "Project Progress Control", sub: "kendali proyek", render: (d) => <ProjectsFocus d={d} /> },
};
