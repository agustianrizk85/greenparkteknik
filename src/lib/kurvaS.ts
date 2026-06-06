// Pure helpers for the construction progress / Kurva S engine. No React, no IO.
import type { ConstructionStage, KurvaWeek, ProgressUnit, Status, Tone, UnitWeeklyProgress } from "../types";

/** Unit completion % = Σ weight of checked stages ÷ Σ weight × 100. */
export function unitPct(unit: ProgressUnit, stages: ConstructionStage[]): number {
  const total = stages.reduce((a, s) => a + s.weight, 0) || 100;
  const done = stages.reduce((a, s) => a + (unit.stages?.[s.name] ? s.weight : 0), 0);
  return (done / total) * 100;
}

/** Traffic-light tone for a completion percentage. */
export function pctTone(pct: number): Status {
  if (pct >= 99.95) return "green";
  if (pct >= 50) return "yellow";
  return "red";
}

export interface DevStatus {
  label: string;
  tone: Tone;
}

/** Deviation category per the Modul Departemen Teknik (deviasi = aktual − target). */
export function deviationStatus(dev: number): DevStatus {
  if (dev >= 5) return { label: "Sangat Cepat", tone: "neutral" };
  if (dev >= 1) return { label: "Lebih Cepat", tone: "green" };
  if (dev >= -0.99) return { label: "On Schedule", tone: "green" };
  if (dev >= -4.99) return { label: "Warning", tone: "yellow" };
  return { label: "Critical Delay", tone: "red" };
}

/** Schedule Performance Index = aktual ÷ target. */
export function spi(actual: number, target: number): number {
  if (target <= 0) return actual > 0 ? 2 : 1;
  return actual / target;
}

/** Latest weekly record per unit (highest week). */
export function latestPerUnit(rows: UnitWeeklyProgress[]): Map<string, UnitWeeklyProgress> {
  const m = new Map<string, UnitWeeklyProgress>();
  for (const r of rows) {
    const cur = m.get(r.unitId);
    if (!cur || r.week > cur.week) m.set(r.unitId, r);
  }
  return m;
}

/**
 * Estimated extra weeks to finish from the average actual increment of the last
 * 4 weeks. Returns 0 when already complete or slope unknown.
 */
export function forecastDelayWeeks(rows: UnitWeeklyProgress[]): number {
  if (rows.length < 2) return 0;
  const sorted = [...rows].sort((a, b) => a.week - b.week);
  const last = sorted[sorted.length - 1];
  if (last.actual >= 100) return 0;
  const recent = sorted.slice(-5); // up to 4 increments
  let inc = 0;
  let n = 0;
  for (let i = 1; i < recent.length; i++) {
    inc += recent[i].actual - recent[i - 1].actual;
    n++;
  }
  const slope = n > 0 ? inc / n : 0;
  if (slope <= 0) return 0;
  return Math.ceil((100 - last.actual) / slope);
}

/** Group stages by termin, preserving the stage order, for grid header colspans. */
export function groupByTermin(stages: ConstructionStage[]): { termin: string; stages: ConstructionStage[] }[] {
  const out: { termin: string; stages: ConstructionStage[] }[] = [];
  for (const s of stages) {
    const last = out[out.length - 1];
    if (last && last.termin === s.termin) last.stages.push(s);
    else out.push({ termin: s.termin, stages: [s] });
  }
  return out;
}

/** Build the aggregate plan (Kurva S cumulative) and realisasi arrays for the chart. */
export function kurvaSeries(weekly: KurvaWeek[], unitWeekly: UnitWeeklyProgress[]) {
  const weeks = [...weekly].sort((a, b) => a.week - b.week);
  const plan = weeks.map((w) => Math.round(w.cumulative));
  // Average actual across units per week (fallback: empty).
  const actual = weeks.map((w) => {
    const rows = unitWeekly.filter((u) => u.week === w.week);
    if (!rows.length) return 0;
    return Math.round(rows.reduce((a, r) => a + r.actual, 0) / rows.length);
  });
  return { labels: weeks.map((w) => "M" + w.week), plan, actual };
}
