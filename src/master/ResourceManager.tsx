import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import type { FieldDef, ResourceConfig } from "./schema";
import { ImportButton } from "./ImportData";

type MasterRecord = Record<string, unknown> & { id: string };
type FormValues = Record<string, string>;

/** Generic create/read/update/delete manager for one master-data resource. */
export function ResourceManager({ config }: { config: ResourceConfig }) {
  const [items, setItems] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const columns = useMemo(() => config.fields.filter((f) => !f.hideInTable), [config]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .list<MasterRecord>(config.key)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [config.key]);

  useEffect(load, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (rec: MasterRecord) => {
    setEditing(rec);
    setFormOpen(true);
  };

  const onDelete = async (rec: MasterRecord) => {
    if (!window.confirm(`Hapus ${config.singular} ini?`)) return;
    try {
      await api.remove(config.key, rec.id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  };

  // Bulk import: create each record in the imported array, then refresh.
  const importItems = async (data: unknown): Promise<number> => {
    const arr = data as Record<string, unknown>[];
    let n = 0;
    for (const raw of arr) {
      await api.create(config.key, normalizeRecord(config, raw));
      n++;
    }
    load();
    return n;
  };

  return (
    <div className="md-panel">
      <header className="md-head">
        <div>
          <h2>{config.title}</h2>
          <span className="md-count">{items.length} data</span>
        </div>
        <div className="md-head-actions">
          <ImportButton
            entity={config.key}
            columns={importColumns(config)}
            sample={[sampleRecord(config)]}
            onImport={importItems}
          />
          <button className="md-btn primary" onClick={openCreate}>
            ＋ Tambah {config.singular}
          </button>
        </div>
      </header>

      {error && <div className="md-error">{error}</div>}

      <div className="md-table-wrap">
        {loading ? (
          <div className="md-empty">Memuat…</div>
        ) : items.length === 0 ? (
          <div className="md-empty">Belum ada data.</div>
        ) : (
          <table className="md-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.name}>{c.label}</th>
                ))}
                <th className="md-actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((rec) => (
                <tr key={rec.id}>
                  {columns.map((c) => (
                    <td key={c.name}>{cellText(rec[c.name])}</td>
                  ))}
                  <td className="md-actions">
                    <button className="md-btn" onClick={() => openEdit(rec)}>
                      Edit
                    </button>
                    <button className="md-btn danger" onClick={() => onDelete(rec)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <RecordForm
          config={config}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function cellText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

/* ---- Create / edit form (modal) --------------------------------------- */

function RecordForm({
  config,
  editing,
  onClose,
  onSaved,
}: {
  config: ResourceConfig;
  editing: MasterRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => initialValues(config, editing));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = buildPayload(config, editing, values);
    try {
      if (editing) {
        await api.update(config.key, editing.id, payload);
      } else {
        await api.create(config.key, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mdf-overlay" onClick={onClose}>
      <form className="mdf-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="mdf-head">
          <h3>
            {editing ? "Edit" : "Tambah"} {config.singular}
          </h3>
          <button type="button" className="mdf-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="mdf-body">
          {config.idEditable && !editing && (
            <Field
              def={{
                name: "id",
                label: config.idLabel ?? "ID",
                type: "text",
                tip: config.idTip ?? "Kunci unik record.",
                result: "Dipakai sebagai identitas; tidak bisa diubah setelah dibuat.",
              }}
              value={values.id ?? ""}
              onChange={set}
            />
          )}
          {config.fields.map((f) => (
            <Field key={f.name} def={f} value={values[f.name] ?? ""} onChange={set} />
          ))}
        </div>

        {error && <div className="mdf-error">{error}</div>}

        <footer className="mdf-foot">
          <button type="button" className="md-btn" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="md-btn primary" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className={`mdf-field ${def.type === "textarea" ? "wide" : ""}`}>
      <span className="mdf-label">
        {def.label}
        {def.tip && (
          <span
            className="mdf-tip"
            tabIndex={0}
            title={def.tip + (def.result ? "\n\nHasil: " + def.result : "")}
          >
            <span className="mdf-tip-i">i</span>
            <span className="mdf-tip-pop" role="tooltip">
              <b>{def.label}</b>
              <span>{def.tip}</span>
              {def.result && (
                <span className="mdf-tip-res">
                  <b>Hasil:</b> {def.result}
                </span>
              )}
            </span>
          </span>
        )}
      </span>
      {def.type === "select" ? (
        <select value={value} onChange={(e) => onChange(def.name, e.target.value)}>
          <option value="">— pilih —</option>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === "textarea" ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(def.name, e.target.value)} />
      ) : (
        <input
          type={def.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(def.name, e.target.value)}
        />
      )}
    </label>
  );
}

/* ---- Value mapping ----------------------------------------------------- */

function initialValues(config: ResourceConfig, editing: MasterRecord | null): FormValues {
  const out: FormValues = {};
  if (config.idEditable) out.id = editing ? String(editing.id ?? "") : "";
  for (const f of config.fields) {
    const raw = editing ? editing[f.name] : undefined;
    if (f.type === "tags") out[f.name] = Array.isArray(raw) ? raw.join(", ") : "";
    else out[f.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return out;
}

function buildPayload(config: ResourceConfig, editing: MasterRecord | null, values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = editing ? { ...editing } : {};
  if (config.idEditable && !editing && values.id.trim() !== "") {
    payload.id = values.id.trim();
  }
  for (const f of config.fields) {
    const raw = values[f.name] ?? "";
    if (f.type === "number") payload[f.name] = raw === "" ? 0 : Number(raw);
    else if (f.type === "tags") payload[f.name] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    else payload[f.name] = raw;
  }
  return payload;
}

/* ---- Import helpers ---------------------------------------------------- */

/** Ordered column keys for the CSV template (id first when user-editable). */
function importColumns(config: ResourceConfig): string[] {
  return [...(config.idEditable ? ["id"] : []), ...config.fields.map((f) => f.name)];
}

/** A blank record matching the schema — used as the import template/sample. */
function sampleRecord(config: ResourceConfig): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  if (config.idEditable) rec.id = "";
  for (const f of config.fields) {
    rec[f.name] =
      f.type === "number" ? 0 : f.type === "tags" ? [] : f.type === "select" ? f.options?.[0]?.value ?? "" : "";
  }
  return rec;
}

/** Coerce one imported record to the field types the API expects. */
function normalizeRecord(config: ResourceConfig, raw: Record<string, unknown>): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  if (config.idEditable && raw.id != null && String(raw.id).trim() !== "") rec.id = String(raw.id).trim();
  for (const f of config.fields) {
    const v = raw[f.name];
    if (f.type === "number") rec[f.name] = v == null || v === "" ? 0 : Number(v);
    else if (f.type === "tags")
      rec[f.name] = Array.isArray(v)
        ? v.map((s) => String(s))
        : typeof v === "string"
          ? v.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
    else rec[f.name] = v == null ? "" : String(v);
  }
  return rec;
}
