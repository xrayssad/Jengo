import assert from "node:assert/strict";
import test from "node:test";
import { dwellReached, mergeCounts, mergeRefresh, withCount } from "./views.ts";

test("a quick swipe does not count", () => {
  assert.equal(dwellReached(1499), false);
  assert.equal(dwellReached(1500), true);
});

test("counted true updates the cached card in place", () => {
  const shown = [
    { id: "a", views_count: 2, title: "A" },
    { id: "b", views_count: 4, title: "B" },
  ];
  const next = mergeCounts(shown, [withCount(shown[0], 3)]);
  assert.deepEqual(next.map((item) => item.id), ["a", "b"]);
  assert.equal(next[0].views_count, 3);
  assert.equal(next[0].views, 3);
  assert.equal(next[1].views_count, 4);
  assert.equal((next[0] as { title?: string }).title, "A");
});

test("refresh merges counts and prepends only unseen rows", () => {
  const shown = [
    { id: "a", views_count: 2 },
    { id: "b", views_count: 4 },
  ];
  const fresh = [
    { id: "c", views_count: 1 },
    { id: "b", views_count: 9 },
    { id: "a", views_count: 2 },
  ];
  const next = mergeRefresh(shown, fresh);
  assert.deepEqual(next.map((item) => item.id), ["c", "a", "b"]);
  assert.equal(next[2].views_count, 9);
});
