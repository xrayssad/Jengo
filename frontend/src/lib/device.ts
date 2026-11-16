/** Runs before paint so the intro and lite mode can be decided without a flash. */
export const DEVICE_BOOT = `(function(){try{var n=navigator;var c=n.hardwareConcurrency||8;var m=n.deviceMemory||8;if(c<=4||m<=2)document.documentElement.setAttribute("data-lite","1");var path=location.pathname||"";var deep=path.indexOf("/tangazo/")===0||path.indexOf("/listing/")===0;var pending=false;var seen=false;try{pending=sessionStorage.getItem("jengo_intro_pending")==="1";seen=sessionStorage.getItem("jengo_intro_seen")==="1";}catch(err){}var nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];var back=nav&&nav.type==="back_forward";var reload=nav&&nav.type==="reload";var skip=deep||(back&&!pending)||(reload&&seen&&!pending);if(skip){document.documentElement.setAttribute("data-splash","off");document.documentElement.setAttribute("data-boot","fade");}else{document.documentElement.setAttribute("data-splash","on");try{sessionStorage.setItem("jengo_intro_seen","1");}catch(err){}}}catch(e){}})();`;

export function isLiteDevice() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.lite === "1";
}
