import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { ImportButton } from "./ImportData";

/** Editor for the site-readiness checklist — an ordered list of strings. */
export function ChecklistEditor() {
  const [rows, setRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .siteChecklist()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const setItem = (i: number, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? value : r)));
  const addRow = () => setRows((rs) => [...rs, ""]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // Import replaces the whole checklist.
  const importRows = async (data: Record<string, unknown>[]): Promise<number> => {
    const items = data
      .map((r) => String(r.item ?? Object.values(r)[0] ?? "").trim())
      .filter((s) => s !== "");
    const next = await api.updateSiteChecklist(items);
    setRows(next);
    return next.length;
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const cleaned = rows.map((r) => r.trim()).filter((r) => r !== "");
      const next = await api.updateSiteChecklist(cleaned);
      setRows(next);
      setSaved(true);
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
          <h2>Site Checklist</h2>
          <span className="md-count">Item kesiapan site · {rows.length} item</span>
        </div>
        <div className="md-head-actions">
          <ImportButton
            entity="site-checklist"
            columns={["item"]}
            sample={
              rows.length
                ? rows.map((r) => ({ item: r }))
                : [{ item: "Akses utama layak, tidak terhalang material" }]
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
                <th style={{ width: 48 }}>#</th>
                <th>Item Checklist</th>
                <th className="md-actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input value={r} onChange={(e) => setItem(i, e.target.value)} style={{ width: "100%" }} />
                  </td>
                  <td className="md-actions">
                    <button className="md-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Naik">
                      ↑
                    </button>
                    <button className="md-btn" onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Turun">
                      ↓
                    </button>
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
