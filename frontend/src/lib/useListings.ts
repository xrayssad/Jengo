"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type SetStateAction } from "react";
import { absorbListings, commitShown, fetchListings, mergeShown, peekListings, readShown, type Listing, type ListingQuery } from "./api";

/** Paint the saved feed immediately. A background refresh never reorders or drops those rows. */
export function useListings(params: ListingQuery) {
  const key = JSON.stringify({
    category: params.category || "",
    q: (params.q || "").trim(),
    sort: params.sort || "",
    status: params.status || "active",
    mine: Boolean(params.mine),
    limit: params.limit || 40,
  });
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [stale, setStale] = useState(false);
  const [offline, setOffline] = useState(false);
  const [version, setVersion] = useState(0);

  const markFailure = (hasRows: boolean) => {
    const disconnected = typeof navigator !== "undefined" && navigator.onLine === false;
    setOffline(disconnected);
    if (hasRows) setStale(true);
  };

  useLayoutEffect(() => {
    let stop = false;
    const query = JSON.parse(key) as ListingQuery;
    const cached = readShown(query);
    const paint = cached.length ? cached : peekListings(query);
    if (paint.length) {
      setItems(paint);
      setLoading(false);
      setError("");
      if (cached.length) setVersion((n) => n + 1);
    } else {
      setItems([]);
      setLoading(true);
    }
    setPending(0);
    setStale(false);
    fetchListings(query)
      .then((res) => {
        if (stop) return;
        const fresh = res.items || [];
        const had = cached.length > 0;
        const absorbed = absorbListings(query, fresh);
        setItems(absorbed.items);
        setPending(absorbed.pending);
        setStale(false);
        setOffline(false);
        setError("");
        if (!had) setVersion((n) => n + 1);
      })
      .catch((err) => {
        if (stop) return;
        markFailure(paint.length > 0);
        if (!paint.length) setError(err instanceof Error ? err.message : "Could not load listings");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [key]);

  const updateItems = useCallback((action: SetStateAction<Listing[]>) => {
    setItems((cur) => {
      const next = typeof action === "function" ? action(cur) : action;
      commitShown(JSON.parse(key) as ListingQuery, next);
      return next;
    });
  }, [key]);

  useEffect(() => {
    const onView = (event: Event) => {
      const detail = (event as CustomEvent).detail as { id?: string; views_count?: number };
      if (!detail?.id || typeof detail.views_count !== "number") return;
      updateItems((cur) => cur.map((item) => (
        item.id === detail.id ? { ...item, views_count: detail.views_count, views: detail.views_count } : item
      )));
    };
    window.addEventListener("jengo-views", onView);
    return () => window.removeEventListener("jengo-views", onView);
  }, [updateItems]);

  const refresh = useCallback(() => {
    const query = JSON.parse(key) as ListingQuery;
    return fetchListings(query)
      .then((res) => {
        const fresh = res.items || [];
        const shown = readShown(query);
        const next = shown.length ? mergeShown(shown, fresh) : fresh;
        commitShown(query, next);
        setItems(next);
        setPending(0);
        setStale(false);
        setOffline(false);
        setError("");
      })
      .catch(() => {
        const disconnected = typeof navigator !== "undefined" && navigator.onLine === false;
        setOffline(disconnected);
        setStale(true);
      });
  }, [key]);

  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      void refresh();
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  return { items, setItems: updateItems, loading, error, pending, stale, offline, refresh, version };
}
