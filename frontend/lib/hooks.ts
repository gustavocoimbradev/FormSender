"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Resource<T> = {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  reload: () => void;
};

/** Loads something when the component mounts or `deps` change, and can reload it. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]): Resource<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [version, setVersion] = useState(0);
  const loader = useRef(load);
  loader.current = load;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    loader.current().then(
      (value) => {
        if (cancelled) return;
        setData(value);
        setLoading(false);
      },
      (failure: unknown) => {
        if (cancelled) return;
        setError(failure);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { data, loading, error, reload };
}
