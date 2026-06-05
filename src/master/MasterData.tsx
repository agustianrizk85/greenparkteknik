import { useState } from "react";
import type { ReactNode } from "react";
import { RESOURCES } from "./schema";
import { ResourceManager } from "./ResourceManager";
import { ProgressTrendEditor } from "./ProgressTrendEditor";
import { QualityEditor } from "./QualityEditor";
import { MetaListEditor } from "./MetaListEditor";
import { ChecklistEditor } from "./ChecklistEditor";
import { api } from "../api/client";

/**
 * Singleton editors that don't fit the generic per-row CRUD ResourceManager
 * (one object / one whole list replaced on save). Each gets its own nav entry.
 */
const SINGLETONS: { key: string; title: string; render: () => ReactNode }[] = [
  { key: "progress-trend", title: "Progress Control", render: () => <ProgressTrendEditor /> },
  { key: "quality", title: "Mutu & Defect", render: () => <QualityEditor /> },
  {
    key: "vendor-status-meta",
    title: "Status Vendor (Meta)",
    render: () => (
      <MetaListEditor
        entity="vendor-status-meta"
        title="Status Vendor"
        subtitle="Klasifikasi kontraktor"
        extra="note"
        load={api.vendorStatusMeta}
        save={api.updateVendorStatusMeta}
      />
    ),
  },
  {
    key: "complaint-meta",
    title: "Level Komplain (Meta)",
    render: () => (
      <MetaListEditor
        entity="complaint-meta"
        title="Level Komplain"
        subtitle="Klasifikasi + SLA"
        extra="sla"
        load={api.complaintMeta}
        save={api.updateComplaintMeta}
      />
    ),
  },
  { key: "site-checklist", title: "Site Checklist", render: () => <ChecklistEditor /> },
];

/** Master-data workspace: a resource picker on the left, its CRUD table on the right. */
export function MasterData() {
  const [activeKey, setActiveKey] = useState(RESOURCES[0].key);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const active = RESOURCES.find((r) => r.key === activeKey) ?? RESOURCES[0];
  const singleton = SINGLETONS.find((s) => s.key === activeKey);

  const run = async (kind: "seed" | "clear", fn: () => Promise<unknown>, confirmMsg: string) => {
    if (busy) return;
    if (!window.confirm(confirmMsg)) return;
    setBusy(kind);
    try {
      await fn();
      // Reload so every table + the dashboard reflect the new data set.
      window.location.reload();
    } catch (e) {
      alert("Gagal: " + (e instanceof Error ? e.message : String(e)));
      setBusy(null);
    }
  };

  const reseed = () =>
    run("seed", () => api.reseed(), "Isi ulang dengan data contoh? Semua perubahan saat ini akan ditimpa.");
  const clearAll = () =>
    run("clear", () => api.clearData(), "Hapus SEMUA data master? Tindakan ini tidak bisa dibatalkan.");

  return (
    <div className="master">
      <aside className="master-nav">
        <div className="master-nav-title">Master Data</div>
        {RESOURCES.map((r) => (
          <button
            key={r.key}
            className={`master-nav-item ${r.key === activeKey ? "active" : ""}`}
            onClick={() => setActiveKey(r.key)}
          >
            {r.title}
          </button>
        ))}
        {SINGLETONS.map((s) => (
          <button
            key={s.key}
            className={`master-nav-item ${activeKey === s.key ? "active" : ""}`}
            onClick={() => setActiveKey(s.key)}
          >
            {s.title}
          </button>
        ))}

        <div className="master-tools">
          <div className="master-nav-title">Alat Data</div>
          <button className="master-tool" onClick={reseed} disabled={busy !== null}>
            {busy === "seed" ? "Memproses…" : "↻ Seed data contoh"}
          </button>
          <button className="master-tool danger" onClick={clearAll} disabled={busy !== null}>
            {busy === "clear" ? "Memproses…" : "🗑 Hapus semua data"}
          </button>
        </div>
      </aside>
      <section className="master-content">
        {singleton ? singleton.render() : <ResourceManager key={active.key} config={active} />}
      </section>
    </div>
  );
}
