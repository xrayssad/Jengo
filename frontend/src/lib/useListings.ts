"use client";

import { useLayoutEffect, useState } from "react";
import { fetchListings, peekListings, type Listing, type ListingQuery } from "./api";

/** Paint a saved feed immediately, then refresh without covering it with a skeleton. */
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

  useLayoutEffect(() => {
    let stop = false;
    const query = JSON.parse(key) as ListingQuery;
    const cached = peekListings(query);
    if (cached.length) {
      setItems(cached);
      setLoading(false);
      setError("");
    } else {
      setItems([]);
      setLoading(true);
    }
    fetchListings(query)
      .then((res) => {
        if (stop) return;
        setItems(res.items || []);
        setError("");
      })
      .catch((err) => {
        if (stop) return;
        if (!cached.length) setError(err instanceof Error ? err.message : "Could not load listings");
      })
      .finally(() => {
        if (!stop) setLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [key]);

  return { items, setItems, loading, error };
}
