import { useState } from "react";
import { api } from "../api/client";

/**
 * AI Insight card — on demand, asks the backend (OpenRouter) to analyse the
 * current dashboard data for the given scope and renders the narrative.
 */
export function AiInsight({ scope, label }: { scope: string; label?: string }) {
  const [text, setText] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  const run = async () => {
    setLoading(true);
    try {
      const r = await api.insight(scope);
      setText(r.insight);
      setModel(r.model ?? "");
      setConfigured(r.configured);
    } catch (e) {
      setText("Gagal: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-insight">
      <div className="ai-head">
        <span className="ai-title">✨ AI Insight{label ? ` — ${label}` : ""}</span>
        {model && <span className="ai-model">{model}</span>}
        <span className="ai-sp" />
        <button className="md-btn" onClick={() => void run()} disabled={loading}>
          {loading ? "Menganalisa…" : text ? "↻ Ulangi" : "Generate"}
        </button>
      </div>
      {!text && !loading && (
        <div className="ai-hint">Klik “Generate” untuk analisa otomatis dari data saat ini.</div>
      )}
      {text && (
        <div className={`ai-body ${configured ? "" : "warn"}`}>
          {text.split("\n").map((line, i) =>
            line.trim() === "" ? <br key={i} /> : <p key={i}>{line}</p>,
          )}
        </div>
      )}
    </div>
  );
}
