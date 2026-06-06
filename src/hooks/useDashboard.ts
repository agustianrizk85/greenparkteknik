import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardData } from "../types";

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: DashboardData; error: null }
  | { status: "error"; data: null; error: string };

/** Fetch the derived dashboard payload. */
export function useDashboard(): [State, () => void] {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });

  const load = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    api
      .dashboard()
      .then((d) => setState({ status: "ready", data: d, error: null }))
      .catch((err: unknown) => {
        setState({ status: "error", data: null, error: err instanceof Error ? err.message : String(err) });
      });
  }, []);

  useEffect(load, [load]);
  return [state, load];
}
