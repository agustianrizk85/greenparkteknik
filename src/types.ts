// Domain types mirroring the Go backend JSON contract (see backend/teknik).

/** Traffic-light health indicator. */
export type Status = "green" | "yellow" | "red";

/** Pill / chip colour tones supported by the stylesheet. */
export type Tone = "green" | "yellow" | "orange" | "red" | "neutral" | "crisis";

export interface Project {
  id: string;
  name: string;
  units: number;
  baseline: number;
  actual: number;
  gap: number;
  delay: number;
  day: number;
  target: number;
  status: Status;
  contractor: string;
  spv: string;
  recovery: string;
  decision: string;
}

export interface Contractor {
  id: string;
  rank: number;
  name: string;
  units: number;
  commitment: number;
  delayFreq: number;
  passRate: number;
  repeat: number;
  takeover: number;
  retensi: number;
  status: string;
}

/** Ordered classification item (vendor status / complaint level). */
export interface MetaItem {
  key: string;
  label: string;
  tone: Tone;
  note?: string;
  sla?: string;
}

export interface DefectCategory {
  name: string;
  count: number;
}

export interface HighRiskUnit {
  unit: string;
  issue: string;
  aging: number;
}

export interface Quality {
  passRate: number;
  open: number;
  closed: number;
  repeat: number;
  repeatRate: number;
  agingAvg: number;
  categories: DefectCategory[];
  highRisk: HighRiskUnit[];
}

export type SLAState = "ok" | "due" | "overdue";
export type PublicRisk = "high" | "med" | "low";

export interface Complaint {
  id: string;
  unit: string;
  issue: string;
  level: string;
  owner: string;
  aging: number;
  slaResp: SLAState;
  slaField: SLAState;
  publicRisk: PublicRisk;
  next: string;
}

export interface SiteReadiness {
  id: string;
  project: string;
  score: number;
  window: string;
  status: Status;
  gaps: string[];
}

export interface HandoverReadiness {
  id: string;
  unit: string;
  score: number;
  window: string;
  status: Status;
}

export interface AIInsight {
  id: string;
  type: string;
  tone: string;
  text: string;
  icon: string;
}

export interface Decision {
  id: string;
  role: string;
  tone: string;
  text: string;
}

export interface ProgressTrend {
  weeks: string[];
  plan: number[];
  actual: number[];
}

export interface KPI {
  id: string;
  no: number;
  kpi: string;
  def: string;
  pic: string;
  upd: string;
  green: string;
  yellow: string;
  red: string;
  val: string;
  state: string;
}

export interface Trigger {
  id: string;
  cond: string;
  thr: string;
  status: string;
  pic: string;
  act: string;
  esc: string;
}

export interface Summary {
  totalProject: number;
  totalUnits: number;
  overall: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  avgDelay: number;
  qualityScore: number;
  complaintRisk: string;
  critical: number;
}

/** One weighted construction stage of the operational checklist. */
export interface ConstructionStage {
  id: string;
  no: number;
  name: string;
  weight: number;
  termin: string; // T1 | T2 | T3 | T4
}

/** One housing unit's progress checklist (stage name -> completed). */
export interface ProgressUnit {
  id: string;
  noInduk: string;
  project: string;
  blok: string;
  tglSpk: string;
  tglSpkFinish: string;
  status: string;
  keterangan: string;
  stages: Record<string, boolean>;
}

/** One weighted work item of the Kurva S master (Master Bobot Pekerjaan). */
export interface WorkItem {
  id: string;
  no: number;
  name: string;
  weight: number;
}

/** One week of the standard 20-week S-curve baseline. */
export interface KurvaWeek {
  id: string;
  week: number;
  weight: number;
  cumulative: number;
}

/** Per-unit, per-week cumulative actual-vs-target record. */
export interface UnitWeeklyProgress {
  id: string;
  unitId: string;
  week: number;
  actual: number;
  target: number;
  updatedBy: string;
}

/** Full payload returned by GET /api/dashboard. */
export interface Dashboard {
  projects: Project[];
  contractors: Contractor[];
  vendorStatusMeta: MetaItem[];
  quality: Quality;
  complaints: Complaint[];
  complaintMeta: MetaItem[];
  siteReadiness: SiteReadiness[];
  handoverReadiness: HandoverReadiness[];
  siteChecklist: string[];
  aiInsights: AIInsight[];
  decisions: Decision[];
  progressTrend: ProgressTrend;
  kpiTable: KPI[];
  triggers: Trigger[];
  constructionStages: ConstructionStage[];
  progressUnits: ProgressUnit[];
  workItems: WorkItem[];
  kurvaWeekly: KurvaWeek[];
  unitWeeklyProgress: UnitWeeklyProgress[];
  summary: Summary;
}

/** Dashboard enriched on the client with key->item lookup maps for the meta arrays. */
export interface DashboardData extends Dashboard {
  vendorStatusMap: Record<string, MetaItem>;
  complaintMap: Record<string, MetaItem>;
}

/** Authenticated operator (no password material). */
export interface AuthUser {
  username: string;
  name: string;
  role: string;
}
