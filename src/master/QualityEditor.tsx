import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Quality } from "../types";
import { ImportJsonButton } from "./ImportData";

/** Numeric headline metrics of the quality singleton, in display order. */
const METRICS: { key: keyof Quality; label: string }[] = [
  { key: "passRate", label: "Pass Rate (%)" },
  { key: "open", label: "Defect Open" },
  { key: "closed", label: "Defect Closed" },
  { key: "repeat", label: "Repeat Defect" },
  { key: "repeatRate", label: "Repeat Rate (%)" },
  { key: "agingAvg", label: "Aging Rata-rata (hari)" },
];

/**
 * Singleton editor for the "Mutu & Defect" (quality) aggregate. Like the
 * progress trend it is one object, not a list, so it has a bespoke form with
 * two nested sub-tables (defect categories + high-risk units).
 */
export function QualityEditor() {
  const [q, setQ] = useState<Quality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .quality()
      .then(setQ)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const setMetric = (key: keyof Quality, value: string) =>
    setQ((prev) => (prev ? { ...prev, [key]: value === "" ? 0 : Number(value) } : prev));

  const setCat = (i: number, key: "name" | "count", value: string) =>
    setQ((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.map((c, idx) =>
              idx === i ? { ...c, [key]: key === "count" ? (value === "" ? 0 : Number(value)) : value } : c,
            ),
          }
        : prev,
    );
  const addCat = () =>
    setQ((prev) => (prev ? { ...prev, categories: [...prev.categories, { name: "", count: 0 }] } : prev));
  const removeCat = (i: number) =>
    setQ((prev) => (prev ? { ...prev, categories: prev.categories.filter((_, idx) => idx !== i) } : prev));

  const setRisk = (i: number, key: "unit" | "issue" | "aging", value: string) =>
    setQ((prev) =>
      prev
        ? {
            ...prev,
            highRisk: prev.highRisk.map((r, idx) =>
              idx === i ? { ...r, [key]: key === "aging" ? (value === "" ? 0 : Number(value)) : value } : r,
            ),
          }
        : prev,
    );
  const addRisk = () =>
    setQ((prev) => (prev ? { ...prev, highRisk: [...prev.highRisk, { unit: "", issue: "", aging: 0 }] } : prev));
  const removeRisk = (i: number) =>
    setQ((prev) => (prev ? { ...prev, highRisk: prev.highRisk.filter((_, idx) => idx !== i) } : prev));

  const save = async () => {
    if (!q) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.updateQuality(q);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // Import replaces the whole quality singleton (nested object → JSON).
  const importQuality = async (data: unknown): Promise<number> => {
    const next = await api.updateQuality(data as Quality);
    setQ(next);
    return 1;
  };

  if (loading) return <div className="md-panel"><div className="md-empty">Memuat…</div></div>;
  if (!q) return <div className="md-panel"><div className="md-error">{error || "Gagal memuat."}</div></div>;

  return (
    <div className="md-panel">
      <header className="md-head">
        <div>
          <h2>Mutu &amp; Defect</h2>
          <span className="md-count">Quality summary · {q.categories.length} kategori · {q.highRisk.length} unit risiko</span>
        </div>
        <div className="md-head-actions">
          <ImportJsonButton entity="quality" sample={q} onImport={importQuality} />
        </div>
      </header>

      {error && <div className="md-error">{error}</div>}
      {saved && <div className="md-count" style={{ color: "var(--green-600)" }}>✓ Tersimpan.</div>}

      {/* Headline metrics */}
      <div className="mdf-body" style={{ marginBottom: 16 }}>
        {METRICS.map((m) => (
          <label key={m.key} className="mdf-field">
            <span>{m.label}</span>
            <input
              type="number"
              value={String(q[m.key] ?? 0)}
              onChange={(e) => setMetric(m.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      {/* Defect categories */}
      <SubTable
        title="Kategori Defect"
        onAdd={addCat}
        addLabel="＋ Tambah Kategori"
        head={["Kategori", "Jumlah"]}
        rows={q.categories.map((c, i) => [
          <input key="n" value={c.name} onChange={(e) => setCat(i, "name", e.target.value)} />,
          <input key="c" type="number" value={String(c.count)} onChange={(e) => setCat(i, "count", e.target.value)} />,
        ])}
        onRemove={removeCat}
        empty="Belum ada kategori."
      />

      {/* High-risk units */}
      <SubTable
        title="Unit High-Risk"
        onAdd={addRisk}
        addLabel="＋ Tambah Unit"
        head={["Unit", "Isu", "Aging (hari)"]}
        rows={q.highRisk.map((r, i) => [
          <input key="u" value={r.unit} onChange={(e) => setRisk(i, "unit", e.target.value)} />,
          <input key="i" value={r.issue} onChange={(e) => setRisk(i, "issue", e.target.value)} />,
          <input key="a" type="number" value={String(r.aging)} onChange={(e) => setRisk(i, "aging", e.target.value)} />,
        ])}
        onRemove={removeRisk}
        empty="Belum ada unit."
      />

      <footer className="mdf-foot" style={{ marginTop: 12 }}>
        <button className="md-btn" onClick={load} disabled={saving}>
          Reset
        </button>
        <button className="md-btn primary" onClick={save} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </footer>
    </div>
  );
}

/* ---- Reusable editable sub-table -------------------------------------- */

function SubTable({
  title,
  head,
  rows,
  onAdd,
  addLabel,
  onRemove,
  empty,
}: {
  title: string;
  head: string[];
  rows: React.ReactNode[][];
  onAdd: () => void;
  addLabel: string;
  onRemove: (i: number) => void;
  empty: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <header className="md-head" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button className="md-btn" onClick={onAdd}>
          {addLabel}
        </button>
      </header>
      {rows.length === 0 ? (
        <div className="md-empty">{empty}</div>
      ) : (
        <table className="md-table">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th className="md-actions-col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i}>
                {cells.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
                <td className="md-actions">
                  <button className="md-btn danger" onClick={() => onRemove(i)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
