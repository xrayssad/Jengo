import assert from "node:assert/strict";
import test from "node:test";
import { rankListings, stickOrder, type SearchListing } from "./productSearch.ts";

const now = Date.parse("2026-11-16T00:00:00Z");

function listing(partial: SearchListing): SearchListing {
  return partial;
}

const room = listing({
  id: "room",
  title: "Chumba self contained",
  description: "Kinondoni",
  category: "chumba_nyumba",
  images: ["a.jpg"],
  is_verified: true,
  created_at: "2026-11-10T00:00:00Z",
});

const godown = listing({
  id: "godown",
  title: "Godown Pugu",
  description: "Warehouse space",
  category: "store_godown",
  location: "Pugu, Dar es Salaam",
  images: ["b.jpg"],
});

const cement = listing({
  id: "cement",
  title: "Cement bags",
  description: "50kg",
  category: "vifaa",
});

const noise = listing({
  id: "noise",
  title: "Kazi ya ujenzi",
  description: "Fundi",
  category: "kazi",
});

const items = [noise, cement, godown, room];

test("exact title match ranks first", () => {
  const ranked = rankListings(items, "chumba", { now });
  assert.equal(ranked.exact[0]?.id, "room");
  assert.equal(ranked.exact.some((item) => item.id === "noise"), false);
  assert.equal(ranked.correction, null);
});

test("a title prefix is an exact result", () => {
  const ranked = rankListings(items, "godo", { now });
  assert.deepEqual(ranked.exact.map((item) => item.id), ["godown"]);
  assert.equal(ranked.correction, null);
});

test("a small typo falls back to a related listing and a correction", () => {
  const ranked = rankListings(items, "godwn", { now });
  assert.equal(ranked.exact.length, 0);
  assert.equal(ranked.related[0]?.id, "godown");
  assert.equal(ranked.correction, "godown");
});

test("synonyms match without calling the title exact", () => {
  const ghala = rankListings(items, "ghala", { now });
  assert.equal(ghala.exact.length, 0);
  assert.equal(ghala.related.some((item) => item.id === "godown"), true);

  const simenti = rankListings(items, "simenti", { now });
  assert.equal(simenti.exact.length, 0);
  assert.equal(simenti.related.some((item) => item.id === "cement"), true);

  const english = rankListings(items, "room", { now });
  assert.equal(english.exact.length, 0);
  assert.equal(english.related.some((item) => item.id === "room"), true);
});

test("an unknown word has no results and no correction", () => {
  const ranked = rankListings(items, "zzzzqqqq", { now });
  assert.deepEqual(ranked.exact, []);
  assert.deepEqual(ranked.related, []);
  assert.equal(ranked.correction, null);
});

test("the same query keeps one order even if the input is reversed", () => {
  const first = rankListings(items, "godown", { now }).exact.map((item) => item.id);
  const second = rankListings([...items].reverse(), "godown", { now }).exact.map((item) => item.id);
  assert.deepEqual(first, second);
});

test("a refresh does not reorder a list the user is already looking at", () => {
  const visible = ["room", "godown"];
  const refreshed = [godown, room, cement];
  const stuck = stickOrder(visible, refreshed);
  assert.deepEqual(stuck.map((item) => item.id), ["room", "godown", "cement"]);
});
