import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { ProgressTrend } from "../types";

/** A single editable point — one column of the progress chart. */
interface Row {
  week: string;
  plan: string;
  actual: string;
}

/**
 * Singleton editor for the "Progress Control" chart (weeks / plan / actual).
 * Unlike the collection resources this is one object, not a list, so it gets
 * its own form instead of the generic ResourceManager.
 */
export function ProgressTrendEditor() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .progressTrend()
      .then((t) => setRows(toRows(t)))
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const setCell = (i: number, key: keyof Row, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const addRow = () =>
    setRows((rs) => [...rs, { week: `W${rs.length + 1}`, plan: "", actual: "" }]);

  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedAt(false);
    try {
      await api.updateProgressTrend(toPayload(rows));
      setSavedAt(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md-panel">
      <header className="md-head">
        <div>
          <h2>Progress Control</h2>
          <span className="md-count">Rencana vs Realisasi · {rows.length} minggu</span>
        </div>
        <button className="md-btn" onClick={addRow} disabled={loading}>
          ＋ Tambah Minggu
        </button>
      </header>

      {error && <div className="md-error">{error}</div>}
      {savedAt && <div className="md-count" style={{ color: "var(--green-600)" }}>✓ Tersimpan.</div>}

      <div className="md-table-wrap">
        {loading ? (
          <div className="md-empty">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="md-empty">Belum ada titik. Klik “Tambah Minggu”.</div>
        ) : (
          <table className="md-table">
            <thead>
              <tr>
                <th>Minggu</th>
                <th>Baseline / Plan (%)</th>
                <th>Actual (%)</th>
                <th className="md-actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input value={r.week} onChange={(e) => setCell(i, "week", e.target.value)} />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.plan}
                      onChange={(e) => setCell(i, "plan", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.actual}
                      onChange={(e) => setCell(i, "actual", e.target.value)}
                    />
                  </td>
                  <td className="md-actions">
                    <button className="md-btn danger" onClick={() => removeRow(i)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="mdf-foot" style={{ marginTop: 12 }}>
        <button className="md-btn" onClick={load} disabled={saving || loading}>
          Reset
        </button>
        <button className="md-btn primary" onClick={save} disabled={saving || loading}>
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </footer>
    </div>
  );
}

/* ---- Mapping between the API model and the editable rows --------------- */

function toRows(t: ProgressTrend): Row[] {
  const n = Math.max(t.weeks.length, t.plan.length, t.actual.length);
  return Array.from({ length: n }, (_, i) => ({
    week: t.weeks[i] ?? `W${i + 1}`,
    plan: t.plan[i] != null ? String(t.plan[i]) : "",
    actual: t.actual[i] != null ? String(t.actual[i]) : "",
  }));
}

function toPayload(rows: Row[]): ProgressTrend {
  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
  return {
    weeks: rows.map((r, i) => (r.week.trim() === "" ? `W${i + 1}` : r.week.trim())),
    plan: rows.map((r) => num(r.plan)),
    actual: rows.map((r) => num(r.actual)),
  };
}
