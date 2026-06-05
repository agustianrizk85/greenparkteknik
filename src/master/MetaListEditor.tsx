import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import type { MetaItem, Tone } from "../types";
import { ImportButton } from "./ImportData";

const TONES: Tone[] = ["green", "yellow", "orange", "red", "neutral", "crisis"];

/**
 * Editor for a classification list (vendor status meta / complaint meta).
 * The whole list is replaced on save (a "list singleton"), so it gets its own
 * form rather than the per-row CRUD of ResourceManager.
 */
export function MetaListEditor({
  entity,
  title,
  subtitle,
  load: loadFn,
  save: saveFn,
  /** Which optional column to surface: "note" (vendor) or "sla" (complaint). */
  extra,
}: {
  entity: string;
  title: string;
  subtitle: string;
  load: () => Promise<MetaItem[]>;
  save: (items: MetaItem[]) => Promise<MetaItem[]>;
  extra: "note" | "sla";
}) {
  const [rows, setRows] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    loadFn()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [loadFn]);

  useEffect(load, [load]);

  const setCell = (i: number, key: keyof MetaItem, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { key: "", label: "", tone: "neutral", note: "", sla: "" }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  // Import replaces the whole classification list.
  const importRows = async (data: Record<string, unknown>[]): Promise<number> => {
    const items: MetaItem[] = data.map((r) => ({
      key: String(r.key ?? "").trim(),
      label: String(r.label ?? ""),
      tone: (String(r.tone ?? "neutral") as Tone),
      note: r.note != null ? String(r.note) : "",
      sla: r.sla != null ? String(r.sla) : "",
    }));
    const next = await saveFn(items);
    setRows(next);
    return next.length;
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const cleaned = rows.map((r) => ({ ...r, key: r.key.trim() }));
      const next = await saveFn(cleaned);
      setRows(next);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const extraLabel = extra === "note" ? "Catatan" : "SLA";

  return (
    <div className="md-panel">
      <header className="md-head">
        <div>
          <h2>{title}</h2>
          <span className="md-count">{subtitle} · {rows.length} item</span>
        </div>
        <div className="md-head-actions">
          <ImportButton
            entity={entity}
            columns={["key", "label", "tone", extra]}
            sample={
              (rows.length
                ? rows
                : [{ key: "contoh", label: "Contoh", tone: "neutral", [extra]: "" }]) as Record<string, unknown>[]
            }
            onImport={importRows}
          />
          <button className="md-btn" onClick={addRow} disabled={loading}>
            ＋ Tambah Item
          </button>
        </div>
      </header>

      {error && <div className="md-error">{error}</div>}
      {saved && <div className="md-count" style={{ color: "var(--green-600)" }}>✓ Tersimpan.</div>}

      <div className="md-table-wrap">
        {loading ? (
          <div className="md-empty">Memuat…</div>
        ) : rows.length === 0 ? (
          <div className="md-empty">Belum ada item.</div>
        ) : (
          <table className="md-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Label</th>
                <th>Tone</th>
                <th>{extraLabel}</th>
                <th className="md-actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input value={r.key} onChange={(e) => setCell(i, "key", e.target.value)} />
                  </td>
                  <td>
                    <input value={r.label} onChange={(e) => setCell(i, "label", e.target.value)} />
                  </td>
                  <td>
                    <select value={r.tone} onChange={(e) => setCell(i, "tone", e.target.value)}>
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={(extra === "note" ? r.note : r.sla) ?? ""}
                      onChange={(e) => setCell(i, extra, e.target.value)}
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
