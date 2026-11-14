/** Runs before paint so splash and parallax can read device hints without a flash. */
export const DEVICE_BOOT = `(function(){try{var n=navigator;var c=n.hardwareConcurrency||8;var m=n.deviceMemory||8;if(c<=4||m<=2)document.documentElement.setAttribute("data-lite","1");var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduce||sessionStorage.getItem("jengo_splash")==="1")document.documentElement.setAttribute("data-splash","off");}catch(e){}})();`;

export function isLiteDevice() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.lite === "1";
}
