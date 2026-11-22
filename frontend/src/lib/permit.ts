const LOCATION_KEY = "jengo_permit_location";

export function locationPermitSeen() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(LOCATION_KEY) === "1";
  } catch {
    return true;
  }
}

export function markLocationPermit() {
  try {
    localStorage.setItem(LOCATION_KEY, "1");
  } catch {
    /* storage blocked */
  }
}

const NOTE_KEY = "jengo_permit_notify";

export function notifyPermitSeen() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(NOTE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markNotifyPermit() {
  try {
    localStorage.setItem(NOTE_KEY, "1");
  } catch {
    /* storage blocked */
  }
}
