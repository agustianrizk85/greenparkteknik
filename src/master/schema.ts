// Declarative schema for the master-data (CRUD) screens. A single generic
// ResourceManager renders any of these configs, so adding a new editable
// resource is just data, not code.

export type FieldType = "text" | "number" | "textarea" | "select" | "tags";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  hideInTable?: boolean;
}

export interface ResourceConfig {
  /** API path segment, e.g. "projects". */
  key: string;
  /** Tab/section title (plural). */
  title: string;
  /** Singular noun used in buttons/dialogs. */
  singular: string;
  /** When true, the id is user-editable on create (natural key/code). */
  idEditable?: boolean;
  idLabel?: string;
  fields: FieldDef[];
}

const STATUS = [
  { value: "green", label: "Hijau · On Track" },
  { value: "yellow", label: "Kuning · At Risk" },
  { value: "red", label: "Merah · Off Track" },
];
const VENDOR_STATUS = [
  { value: "preferred", label: "Preferred" },
  { value: "normal", label: "Normal" },
  { value: "watchlist", label: "Watchlist" },
  { value: "probation", label: "Probation" },
  { value: "blacklist", label: "Blacklist Cand." },
];
const COMPLAINT_LEVEL = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
];
const SLA = [
  { value: "ok", label: "On-time" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
];
const PUBLIC_RISK = [
  { value: "high", label: "Tinggi" },
  { value: "med", label: "Sedang" },
  { value: "low", label: "Rendah" },
];
const AI_TONE = [
  { value: "red", label: "Merah" },
  { value: "orange", label: "Oranye" },
  { value: "yellow", label: "Kuning" },
  { value: "green", label: "Hijau" },
];
const DECISION_TONE = [
  { value: "red", label: "Merah" },
  { value: "orange", label: "Oranye" },
  { value: "navy", label: "Navy" },
];
const AI_ICON = [
  { value: "trend", label: "Trend" },
  { value: "pattern", label: "Pattern" },
  { value: "vendor", label: "Vendor" },
  { value: "alert", label: "Alert" },
  { value: "site", label: "Site" },
  { value: "rec", label: "Recommendation" },
];
const KPI_STATE = [
  { value: "green", label: "Hijau" },
  { value: "yellow", label: "Kuning" },
  { value: "red", label: "Merah" },
];
const TRIGGER_STATUS = [
  { value: "yellow", label: "Kuning" },
  { value: "red", label: "Merah" },
  { value: "crisis", label: "Crisis" },
  { value: "green", label: "Hijau" },
];

export const RESOURCES: ResourceConfig[] = [
  {
    key: "projects",
    title: "Proyek",
    singular: "Proyek",
    idEditable: true,
    idLabel: "ID / Slug",
    fields: [
      { name: "name", label: "Nama Proyek", type: "text" },
      { name: "contractor", label: "Kontraktor", type: "text" },
      { name: "spv", label: "SPV", type: "text" },
      { name: "units", label: "Unit", type: "number" },
      { name: "baseline", label: "Baseline (%)", type: "number", hideInTable: true },
      { name: "actual", label: "Actual (%)", type: "number" },
      { name: "delay", label: "Delay (hari)", type: "number" },
      { name: "day", label: "Hari ke-", type: "number", hideInTable: true },
      { name: "target", label: "Target (hari)", type: "number", hideInTable: true },
      { name: "status", label: "Status", type: "select", options: STATUS },
      { name: "recovery", label: "Recovery Plan", type: "text", hideInTable: true },
      { name: "decision", label: "Decision Needed", type: "text", hideInTable: true },
    ],
  },
  {
    key: "contractors",
    title: "Kontraktor",
    singular: "Kontraktor",
    fields: [
      { name: "rank", label: "Rank", type: "number" },
      { name: "name", label: "Nama Kontraktor", type: "text" },
      { name: "units", label: "Unit", type: "number" },
      { name: "commitment", label: "Commitment (%)", type: "number", hideInTable: true },
      { name: "delayFreq", label: "Delay Freq", type: "number" },
      { name: "passRate", label: "Pass Rate (%)", type: "number" },
      { name: "repeat", label: "Repeat Defect", type: "number", hideInTable: true },
      { name: "takeover", label: "Take Over", type: "number", hideInTable: true },
      { name: "retensi", label: "Retensi (%)", type: "number", hideInTable: true },
      { name: "status", label: "Status Vendor", type: "select", options: VENDOR_STATUS },
    ],
  },
  {
    key: "complaints",
    title: "Komplain",
    singular: "Komplain",
    idEditable: true,
    idLabel: "Kode (mis. K-118)",
    fields: [
      { name: "unit", label: "Unit", type: "text" },
      { name: "issue", label: "Isu", type: "textarea" },
      { name: "level", label: "Level", type: "select", options: COMPLAINT_LEVEL },
      { name: "owner", label: "Owner", type: "text" },
      { name: "aging", label: "Aging (hari)", type: "number" },
      { name: "slaResp", label: "SLA Respon", type: "select", options: SLA, hideInTable: true },
      { name: "slaField", label: "SLA Lapangan", type: "select", options: SLA },
      { name: "publicRisk", label: "Risiko Publik", type: "select", options: PUBLIC_RISK },
      { name: "next", label: "Next Communication", type: "text", hideInTable: true },
    ],
  },
  {
    key: "site-readiness",
    title: "Site Readiness",
    singular: "Site Readiness",
    fields: [
      { name: "project", label: "Proyek", type: "text" },
      { name: "window", label: "Window (mis. H-7)", type: "text" },
      { name: "score", label: "Score", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS },
      { name: "gaps", label: "Gap Utama (pisahkan dengan koma)", type: "tags", hideInTable: true },
    ],
  },
  {
    key: "handover-readiness",
    title: "Handover Readiness",
    singular: "Handover",
    fields: [
      { name: "unit", label: "Unit", type: "text" },
      { name: "window", label: "Window (mis. H-7)", type: "text" },
      { name: "score", label: "Score", type: "number" },
      { name: "status", label: "Status", type: "select", options: STATUS },
    ],
  },
  {
    key: "ai-insights",
    title: "AI Insights",
    singular: "Insight",
    fields: [
      { name: "type", label: "Tipe", type: "text" },
      { name: "tone", label: "Tone", type: "select", options: AI_TONE },
      { name: "icon", label: "Ikon", type: "select", options: AI_ICON, hideInTable: true },
      { name: "text", label: "Teks Insight", type: "textarea" },
    ],
  },
  {
    key: "decisions",
    title: "Critical Decisions",
    singular: "Decision",
    fields: [
      { name: "role", label: "Role", type: "text" },
      { name: "tone", label: "Tone", type: "select", options: DECISION_TONE },
      { name: "text", label: "Keputusan", type: "textarea" },
    ],
  },
  {
    key: "kpis",
    title: "KPI",
    singular: "KPI",
    fields: [
      { name: "no", label: "No", type: "number" },
      { name: "kpi", label: "Nama KPI", type: "text" },
      { name: "def", label: "Definisi", type: "text", hideInTable: true },
      { name: "pic", label: "PIC", type: "text", hideInTable: true },
      { name: "upd", label: "Update", type: "text", hideInTable: true },
      { name: "green", label: "Ambang Hijau", type: "text", hideInTable: true },
      { name: "yellow", label: "Ambang Kuning", type: "text", hideInTable: true },
      { name: "red", label: "Ambang Merah", type: "text", hideInTable: true },
      { name: "val", label: "Nilai Kini", type: "text" },
      { name: "state", label: "Status", type: "select", options: KPI_STATE },
    ],
  },
  {
    key: "triggers",
    title: "Early Warning",
    singular: "Trigger",
    fields: [
      { name: "cond", label: "Kondisi", type: "text" },
      { name: "thr", label: "Ambang Batas", type: "text" },
      { name: "status", label: "Status", type: "select", options: TRIGGER_STATUS },
      { name: "pic", label: "PIC", type: "text" },
      { name: "act", label: "Tindakan Wajib", type: "text", hideInTable: true },
      { name: "esc", label: "Eskalasi", type: "text", hideInTable: true },
    ],
  },
];
