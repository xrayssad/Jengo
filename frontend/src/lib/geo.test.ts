import assert from "node:assert/strict";
import test from "node:test";
import {
  KNOWN_POINTS,
  buildPlaceLabel,
  geoJsonPair,
  getPreciseLocation,
  inTanzania,
  leafletPair,
  pickBestFix,
  publicMapIsApproximate,
  resolvingLocation,
  roundCoord,
  type GeoWatch,
  type PreciseFix,
} from "./geo.ts";

function fix(accuracy: number, lat = -6.792354, lng = 39.208328): PreciseFix {
  return { lat, lng, accuracy, timestamp: 1_700_000_000_000 };
}

test("the tightest fix wins and a later worse fix is ignored", () => {
  const first = pickBestFix(null, fix(180));
  const second = pickBestFix(first, fix(70));
  const third = pickBestFix(second, fix(140));
  assert.equal(third.accuracy, 70);
});

test("watchPosition keeps the best fix and stops at the target accuracy", async () => {
  let cleared = 0;
  const seen: number[] = [];
  const watch: GeoWatch = {
    watchPosition(success, _error, options) {
      assert.equal(options.enableHighAccuracy, true);
      assert.equal(options.maximumAge, 0);
      assert.equal(options.timeout, 15000);
      queueMicrotask(() => {
        success({ coords: { latitude: -6.79, longitude: 39.21, accuracy: 420 }, timestamp: 10 });
        success({ coords: { latitude: -6.7924, longitude: 39.2083, accuracy: 90 }, timestamp: 20 });
        success({ coords: { latitude: -6.79241, longitude: 39.20831, accuracy: 40 }, timestamp: 30 });
      });
      return 7;
    },
    clearWatch(id) {
      cleared = id;
    },
  };
  const result = await getPreciseLocation({
    watch,
    targetAccuracyM: 50,
    timeoutMs: 15000,
    secure: true,
    onFix: (row) => seen.push(row.accuracy),
  });
  assert.equal(result.accuracy, 40);
  assert.equal(result.lat, roundCoord(-6.79241));
  assert.equal(result.lng, roundCoord(39.20831));
  assert.deepEqual(seen, [420, 90, 40]);
  assert.equal(cleared, 7);
});

test("a watch timeout does not throw away a later fix", async () => {
  const modes: boolean[] = [];
  const watch: GeoWatch = {
    watchPosition(success, error, options) {
      modes.push(options.enableHighAccuracy);
      if (options.enableHighAccuracy) {
        queueMicrotask(() => {
          error({ code: 3 });
          success({ coords: { latitude: -6.7924, longitude: 39.2083, accuracy: 36 }, timestamp: 4 });
        });
      }
      return modes.length;
    },
    clearWatch() {},
  };
  const result = await getPreciseLocation({ watch, targetAccuracyM: 50, timeoutMs: 1000, secure: true });
  assert.equal(result.accuracy, 36);
  assert.equal(result.lat, roundCoord(-6.7924));
  assert.deepEqual(modes, [true, false]);
});

test("permission denied rejects when nothing has been found", async () => {
  const watch: GeoWatch = {
    watchPosition(_success, error) {
      queueMicrotask(() => error({ code: 1 }));
      return 2;
    },
    clearWatch() {},
  };
  await assert.rejects(
    getPreciseLocation({ watch, secure: true, timeoutMs: 1000 }),
    (err: { code?: number }) => err.code === 1,
  );
});

test("a timeout returns the best fix collected so far", async () => {
  const watch: GeoWatch = {
    watchPosition(success) {
      queueMicrotask(() => {
        success({ coords: { latitude: -6.8, longitude: 39.2, accuracy: 800 }, timestamp: 1 });
        success({ coords: { latitude: -6.79, longitude: 39.21, accuracy: 240 }, timestamp: 2 });
      });
      return 3;
    },
    clearWatch() {},
  };
  const result = await getPreciseLocation({ watch, targetAccuracyM: 50, timeoutMs: 40, secure: true });
  assert.equal(result.accuracy, 240);
});

test("Leaflet order is latitude then longitude, GeoJSON is the reverse", () => {
  const dar = KNOWN_POINTS["Dar es Salaam"];
  assert.deepEqual(leafletPair(dar.lat, dar.lng), [dar.lat, dar.lng]);
  assert.deepEqual(geoJsonPair(dar.lat, dar.lng), [dar.lng, dar.lat]);
  assert.notDeepEqual(leafletPair(dar.lat, dar.lng), geoJsonPair(dar.lat, dar.lng));
});

test("known towns sit inside Tanzania and keep six decimal places", () => {
  for (const point of Object.values(KNOWN_POINTS)) {
    assert.equal(inTanzania(point.lat, point.lng), true);
    assert.equal(roundCoord(point.lat + 0.0000004), point.lat);
  }
  assert.equal(inTanzania(51.5, -0.12), false);
  assert.equal(roundCoord(39.2083284), 39.208328);
});

test("placeholder location text is still resolving", () => {
  assert.equal(resolvingLocation("Inatafuta jina la eneo..."), true);
  assert.equal(resolvingLocation("Finding the place name..."), true);
  assert.equal(resolvingLocation("Kariakoo, Ilala, Dar es Salaam"), false);
});

test("homes and apartments hide the exact public pin unless the owner asks", () => {
  assert.equal(publicMapIsApproximate("rooms-houses", false, false), true);
  assert.equal(publicMapIsApproximate("apartment_airbnb", false, false), true);
  assert.equal(publicMapIsApproximate("rooms-houses", true, false), false);
  assert.equal(publicMapIsApproximate("rooms-houses", false, true), false);
  assert.equal(publicMapIsApproximate("plots", false, false), false);
  assert.equal(publicMapIsApproximate("store_godown", false, false), false);
});

test("a place label uses street, then neighbourhood, then ward", () => {
  assert.equal(
    buildPlaceLabel({ street: "Msimbazi Street", district: "Ilala", region: "Dar es Salaam" }),
    "Msimbazi Street, Ilala, Dar es Salaam",
  );
  assert.equal(
    buildPlaceLabel({ neighbourhood: "Kariakoo", district: "Ilala", region: "Dar es Salaam" }),
    "Kariakoo, Ilala, Dar es Salaam",
  );
  assert.equal(buildPlaceLabel({ ward: "Mikocheni", district: "Kinondoni" }), "Mikocheni, Kinondoni");
  assert.equal(buildPlaceLabel({ region: "Mwanza" }), "Mwanza");
  assert.equal(buildPlaceLabel({ street: "Tanzania", district: "Ilemela", region: "Mwanza" }), "Ilemela, Mwanza");
});
