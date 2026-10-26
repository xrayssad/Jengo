"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import {
  catLabel,
  fetchAdminBookings,
  fetchAdminListings,
  fetchAdminStats,
  fetchAdminUsers,
  formatPrice,
  setAdminListingStatus,
  setAdminUserStatus,
  type AdminBooking,
  type AdminStats,
  type AdminUser,
  type Listing,
} from "@/lib/api";

type Tab = "muhtasari" | "watumiaji" | "matangazo" | "maombi";

const TABS: { id: Tab; label: string }[] = [
  { id: "muhtasari", label: "Overview" },
  { id: "watumiaji", label: "Users" },
  { id: "matangazo", label: "Listings" },
  { id: "maombi", label: "Requests" },
];

const LISTING_STATUS: Record<string, string> = {
  active: "Live",
  hidden: "Hidden",
  pending: "Live",
  rejected: "Rejected",
};

const BOOKING_STATUS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  moved_in: "Moved in",
};

const USER_STATUS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
};

function deskError(err: unknown) {
  return err instanceof Error ? err.message : "Could not load";
}

function AdminDesk() {
  const [tab, setTab] = useState<Tab>("muhtasari");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setError("");
    const [s, u, l, b] = await Promise.all([
      fetchAdminStats(),
      fetchAdminUsers(),
      fetchAdminListings(),
      fetchAdminBookings(),
    ]);
    setStats(s);
    setUsers(u.items || []);
    setListings(l.items || []);
    setBookings(b.items || []);
  };

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!stop) setError(deskError(err));
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  const counts = useMemo(
    () => [
      { label: "Users", value: stats ? String(stats.users) : "—" },
      { label: "Listings", value: stats ? String(stats.listings) : "—" },
      { label: "Requests", value: stats ? String(stats.bookings) : "—" },
      { label: "Commission", value: stats ? `TZS ${formatPrice(stats.commission)}` : "—" },
    ],
    [stats],
  );

  const act = async (key: string, work: () => Promise<void>, done: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(done);
    } catch (err) {
      setError(deskError(err));
    } finally {
      setBusy("");
    }
  };

  const hideListing = (item: Listing) =>
    act(
      item.id,
      async () => {
        const next = await setAdminListingStatus(item.id, item.status === "hidden" ? "active" : "hidden");
        setListings((cur) => cur.map((row) => (row.id === item.id ? next : row)));
      },
      item.status === "hidden" ? "Listing is back on Discover." : "Listing hidden from Discover.",
    );

  const toggleUser = (row: AdminUser) =>
    act(
      row.id,
      async () => {
        const next = await setAdminUserStatus(row.id, row.status === "suspended" ? "active" : "suspended");
        setUsers((cur) => cur.map((u) => (u.id === row.id ? next : u)));
      },
      row.status === "suspended" ? "Account reopened." : "Account suspended.",
    );

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      <header className="sticky top-0 z-20 glass" style={{ borderBottom: "1px solid rgba(var(--ink-rgb),0.1)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-2xl leading-none" style={{ color: "var(--ink)" }}>Desk</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Users, listings, requests</p>
          </div>
          <Link href="/home" className="text-sm font-semibold pb-0.5" style={{ color: "var(--mocha)" }}>
            Back to market
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((item) => {
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="px-3 py-2.5 text-sm font-semibold"
                style={{
                  color: on ? "var(--ink)" : "var(--muted)",
                  borderBottom: on ? "2px solid var(--ink)" : "2px solid transparent",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="min-h-[70vh] px-1 py-2 sm:px-0">
          {loading && <p style={{ color: "var(--muted)" }}>Loading desk...</p>}
          {error && <p className="text-sm font-semibold mb-4" style={{ color: "var(--error)" }}>{error}</p>}
          {notice && <p className="text-sm font-semibold mb-4" style={{ color: "var(--success)" }}>{notice}</p>}

          {!loading && tab === "muhtasari" && (
            <div>
              <h1 className="font-heading text-3xl mb-1">Market status</h1>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                These numbers come from verified accounts, all listings, requests, and commission recorded after move-in.
              </p>
              <div
                className="grid grid-cols-2 md:grid-cols-4"
                style={{ borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)" }}
              >
                {counts.map((item, i) => (
                  <div
                    key={item.label}
                    className="py-4 pr-4"
                    style={{ borderLeft: i === 0 ? "none" : "1px solid rgba(var(--ink-rgb),0.18)", paddingLeft: i === 0 ? 0 : 16 }}
                  >
                    <p className="text-sm" style={{ color: "var(--muted)" }}>{item.label}</p>
                    <p className="font-heading text-2xl mt-1 break-words">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && tab === "watumiaji" && (
            <div>
              <h1 className="font-heading text-3xl mb-1">Users</h1>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                You can suspend an account so it cannot sign in. Role does not change here.
              </p>
              {users.length === 0 ? (
                <p>No users yet. New sign-ups will appear here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--ink)" }}>
                        <th className="py-2 font-semibold">Username</th>
                        <th className="py-2 font-semibold">Email</th>
                        <th className="py-2 font-semibold">Role</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((row) => (
                        <tr key={row.id} style={{ borderBottom: "1px solid rgba(var(--ink-rgb),0.12)" }}>
                          <td className="py-3 pr-3">{row.username || "—"}</td>
                          <td className="py-3 pr-3">{row.email || "—"}</td>
                          <td className="py-3 pr-3">{row.role === "admin" ? "admin" : "user"}</td>
                          <td className="py-3 pr-3">{USER_STATUS[row.status || "active"] || row.status}</td>
                          <td className="py-3">
                            {row.role === "admin" ? (
                              <span style={{ color: "var(--muted)" }}>Protected</span>
                            ) : (
                              <button
                                type="button"
                                disabled={busy === row.id}
                                onClick={() => toggleUser(row)}
                                className="font-semibold underline-offset-2 hover:underline disabled:opacity-60"
                              >
                                {row.status === "suspended" ? "Reopen" : "Suspend"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && tab === "matangazo" && (
            <div>
              <h1 className="font-heading text-3xl mb-1">Listings</h1>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                Hide to remove it from Discover. Restore to show it again. No approval is required before publishing.
              </p>
              {listings.length === 0 ? (
                <p>No listings yet. User posts will appear here, every category.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--ink)" }}>
                        <th className="py-2 font-semibold">Title</th>
                        <th className="py-2 font-semibold">Category</th>
                        <th className="py-2 font-semibold">Price</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid rgba(var(--ink-rgb),0.12)" }}>
                          <td className="py-3 pr-3">{item.title}</td>
                          <td className="py-3 pr-3">{catLabel[item.category || ""] || item.category || "—"}</td>
                          <td className="py-3 pr-3">TZS {formatPrice(item.price)}</td>
                          <td className="py-3 pr-3">{LISTING_STATUS[item.status || "active"] || item.status}</td>
                          <td className="py-3">
                            <button
                              type="button"
                              disabled={busy === item.id}
                              onClick={() => hideListing(item)}
                              className="font-semibold underline-offset-2 hover:underline disabled:opacity-60"
                            >
                              {item.status === "hidden" ? "Restore" : "Hide"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && tab === "maombi" && (
            <div>
              <h1 className="font-heading text-3xl mb-1">Requests</h1>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                Status of each request. Commission appears after move-in; payment is not taken here.
              </p>
              {bookings.length === 0 ? (
                <p>No requests yet. Those sent on listings will appear here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--ink)" }}>
                        <th className="py-2 font-semibold">Listing</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((row) => (
                        <tr key={row.id} style={{ borderBottom: "1px solid rgba(var(--ink-rgb),0.12)" }}>
                          <td className="py-3 pr-3">{row.listing_title || row.listing_id}</td>
                          <td className="py-3 pr-3">{BOOKING_STATUS[row.status || "pending"] || row.status}</td>
                          <td className="py-3">
                            {row.commission_amount != null ? `TZS ${formatPrice(row.commission_amount)}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <AuthGate admin>
      <AdminDesk />
    </AuthGate>
  );
}
