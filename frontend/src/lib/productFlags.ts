/** Product flags. Eligibility thresholds for verification live on the server. */

export const INTRO_DURATION_MS = 7000;
export const INTRO_SKIP_AFTER_MS = 2000;
export const INTRO_SKIPPABLE = true;
/** Kept for callers. The intro is not gated by a once-per-session flag. */
export const INTRO_EVERY_LAUNCH = false;

export const VERIFIED_BADGE_ENABLED = true;
/** Optional sort in the filter sheet. Off until we want it in the UI. */
export const VERIFIED_FIRST_SORT = false;
/** Optional tie-break so a verified seller ranks ahead of an otherwise equal newest listing. */
export const VERIFIED_BOOST = false;

export const VIEW_DWELL_MS = 1500;

/** `/` goes straight to Home. The old marketing page lives at `/about`. */
export const SHOW_LANDING_PAGE = false;
