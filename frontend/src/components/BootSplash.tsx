const BOOT_CSS = `
#boot-splash {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #14231A;
  color: #F2EDE4;
  --logo-ink: #F2EDE4;
  --logo-accent: #D4A95A;
}
.boot-stage { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.boot-pin { animation: boot-bounce 900ms ease-in-out infinite; }
.boot-shadow {
  width: 46px;
  height: 8px;
  margin-top: -6px;
  border-radius: 50%;
  background: rgba(242, 237, 228, 0.28);
  animation: boot-shadow 900ms ease-in-out infinite;
}
.boot-fail { display: none; flex-direction: column; align-items: center; gap: 14px; text-align: center; padding: 24px; }
.boot-msg { margin: 0; font: 600 16px/1.4 Georgia, "Iowan Old Style", Palatino, serif; }
.boot-msg::before { content: "Check your connection"; }
html[data-lang="sw"] .boot-msg::before { content: "Angalia mtandao wako"; }
.boot-retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: #F2EDE4;
  color: #14231A;
  font: 700 14px/1 system-ui, sans-serif;
  text-decoration: none;
}
.boot-sw { display: none; }
html[data-lang="sw"] .boot-en { display: none; }
html[data-lang="sw"] .boot-sw { display: inline-flex; }
#boot-splash.is-failed .boot-pin,
#boot-splash.is-failed .boot-shadow { animation: none; }
#boot-splash.is-failed .boot-fail { display: flex; }
html[data-boot="fade"] #boot-splash { animation: boot-out 200ms linear forwards; pointer-events: none; }
html[data-boot="gone"] #boot-splash,
html[data-intro="1"] #boot-splash {
  animation: none;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
@keyframes boot-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes boot-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.35; }
  50% { transform: scaleX(0.7); opacity: 0.16; }
}
@keyframes boot-out { to { opacity: 0; visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  .boot-pin, .boot-shadow { animation: none !important; }
}
`;

export default function BootSplash() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOOT_CSS }} />
      <div id="boot-splash" aria-hidden="true">
        <div className="boot-stage">
          <div className="boot-pin">
            <svg viewBox="0 14 44 70" width="45" height="72" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 78C22 78 3 56 3 38A19 19 0 1 1 41 38C41 56 22 78 22 78Z" />
              <path d="M13 40L22 31L31 40V48H13Z" fill="var(--logo-accent)" stroke="none" />
            </svg>
          </div>
          <span className="boot-shadow" />
          <svg viewBox="0 -4 260 96" height="28" width="76" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M28 2V42C28 54 20 62 8 62" />
            <path transform="translate(42 0)" d="M2 40H42A20 20 0 1 0 36 54" />
            <path transform="translate(98 0)" d="M2 20V60M2 36C2 26 10 20 22 20C34 20 42 27 42 38V60" />
            <g transform="translate(154 0)"><circle cx="22" cy="40" r="20" /><path d="M42 20V66C42 80 32 86 20 86C12 86 6 83 2 78" /></g>
            <g transform="translate(210 0)">
              <path d="M22 78C22 78 3 56 3 38A19 19 0 1 1 41 38C41 56 22 78 22 78Z" />
              <path d="M13 40L22 31L31 40V48H13Z" fill="var(--logo-accent)" stroke="none" />
            </g>
          </svg>
        </div>
        <div className="boot-fail">
          <svg viewBox="0 14 44 70" width="45" height="72" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 78C22 78 3 56 3 38A19 19 0 1 1 41 38C41 56 22 78 22 78Z" />
            <path d="M13 40L22 31L31 40V48H13Z" fill="var(--logo-accent)" stroke="none" />
          </svg>
          <p className="boot-msg" />
          <a className="boot-retry boot-en" href="">Retry</a>
          <a className="boot-retry boot-sw" href="">Jaribu tena</a>
        </div>
      </div>
    </>
  );
}
