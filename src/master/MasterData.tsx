import { useState } from "react";
import { RESOURCES } from "./schema";
import { ResourceManager } from "./ResourceManager";

/** Master-data workspace: a resource picker on the left, its CRUD table on the right. */
export function MasterData() {
  const [activeKey, setActiveKey] = useState(RESOURCES[0].key);
  const active = RESOURCES.find((r) => r.key === activeKey) ?? RESOURCES[0];

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
      </aside>
      <section className="master-content">
        <ResourceManager key={active.key} config={active} />
      </section>
    </div>
  );
}
