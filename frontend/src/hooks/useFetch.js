import { useEffect, useState } from "react";

// Runs `fetcher()` on mount and whenever `deps` change, and tracks
// loading / error state so pages don't repeat the same boilerplate.
//
//   const { data, loading, error, reload } = useFetch(() => fetchTasks(), []);
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false; // ignore results from outdated requests
    setLoading(true);
    setError("");

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, reloadCount]);

  return { data, setData, loading, error, reload: () => setReloadCount((n) => n + 1) };
}
