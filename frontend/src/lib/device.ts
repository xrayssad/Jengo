import { INTRO_EVERY_LAUNCH } from "./productFlags";

/** Runs before paint so the intro and lite mode can be decided without a flash. */
const sessionCheck = INTRO_EVERY_LAUNCH ? "false" : 'sessionStorage.getItem("jengo_splash")==="1"';
export const DEVICE_BOOT = `(function(){try{var n=navigator;var c=n.hardwareConcurrency||8;var m=n.deviceMemory||8;if(c<=4||m<=2)document.documentElement.setAttribute("data-lite","1");var path=location.pathname||"";var deep=path.indexOf("/tangazo/")===0||path.indexOf("/listing/")===0;if(deep||${sessionCheck})document.documentElement.setAttribute("data-splash","off");}catch(e){}})();`;

export function isLiteDevice() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.lite === "1";
}
