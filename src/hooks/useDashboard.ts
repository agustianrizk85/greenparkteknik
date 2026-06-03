import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { toMap } from "../lib/status";
import type { DashboardData } from "../types";

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: DashboardData; error: null }
  | { status: "error"; data: null; error: string };

/** Fetch the dashboard payload and enrich it with meta lookup maps. */
export function useDashboard(): [State, () => void] {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });

  const load = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    api
      .dashboard()
      .then((d) => {
        const enriched: DashboardData = {
          ...d,
          vendorStatusMap: toMap(d.vendorStatusMeta),
          complaintMap: toMap(d.complaintMeta),
        };
        setState({ status: "ready", data: enriched, error: null });
      })
      .catch((err: unknown) => {
        setState({ status: "error", data: null, error: err instanceof Error ? err.message : String(err) });
      });
  }, []);

  useEffect(load, [load]);
  return [state, load];
}
