import { Home, Store, BrickWall, Gavel, Search, Plus, User } from "lucide-react";
import Link from "next/link";

const categories = [
  { title: "Nyumba & Vyumba", description: "Panga au uze nyumba", icon: Home, href: "/nyumba", delay: "d1" },
  { title: "Maduka & Godown", description: "Frame na maduka", icon: Store, href: "/maduka", delay: "d2" },
  { title: "Vifaa vya Ujenzi", description: "Saruji, chuma, matofali", icon: BrickWall, href: "/vifaa", delay: "d3" },
  { title: "Mnada", description: "Bei bora inashinda", icon: Gavel, href: "/mnada", delay: "d4" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, #D2A679 0%, transparent 70%)" }} />

      <header className="sticky top-0 z-20 px-4 py-4 glass" style={{ borderBottom: "1px solid rgba(210,166,121,0.35)" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="anim-up">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#2E1A0F" }}>Nyumba</h1>
            <p className="text-[11px] tracking-[0.18em] uppercase font-medium" style={{ color: "#8B5E3C" }}>Marketplace</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
              <Search size={17} strokeWidth={2.2} />
            </Link>
            <Link href="/profile" className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm">
              <User size={17} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pb-32 relative z-10">
        <section className="mt-6 mb-8 anim-up">
          <h2 className="text-[28px] font-bold leading-[1.25]" style={{ color: "#2E1A0F" }}>
            Tafuta nyumba,<br />duka au vifaa
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#5C4033" }}>
            Bei wazi • Wauzaji waliothibitishwa • Mnada rahisi
          </p>
        </section>

        <Link href="/search"
          className="anim-up d1 flex items-center gap-3 px-4 py-3.5 mb-8 rounded-[20px] shadow-warm-sm"
          style={{ backgroundColor: "white", border: "1.5px solid rgba(210,166,121,0.6)" }}>
          <Search size={18} color="#8B5E3C" strokeWidth={2} />
          <span className="text-sm" style={{ color: "#8B5E3C" }}>Tafuta nyumba, duka, vifaa...</span>
        </Link>

        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.title} href={cat.href}
                className={`card-lift anim-up ${cat.delay} text-left p-5 rounded-[22px] relative overflow-hidden`}
                style={{
                  background: "linear-gradient(165deg, #3D2415 0%, #2E1A0F 55%, #1A0F08 100%)",
                  border: "1px solid rgba(210,166,121,0.25)",
                  boxShadow: "0 8px 28px rgba(46, 26, 15, 0.45), inset 0 1px 0 rgba(255,246,237,0.08)",
                }}>
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-40 blur-2xl pointer-events-none"
                  style={{ background: "radial-gradient(circle, #8B5E3C 0%, transparent 70%)" }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(145deg, rgba(139,94,60,0.45), rgba(46,26,15,0.6))", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
                    <Icon size={22} color="#F5E6D3" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-bold text-[15px] leading-tight" style={{ color: "#FFF6ED" }}>{cat.title}</h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#D2A679" }}>{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 z-30">
        <div className="max-w-md mx-auto">
          <Link href="/weka-tangazo"
            className="btn-primary pulse-cta w-full py-4 rounded-[20px] font-semibold text-[15px] flex items-center justify-center gap-2.5">
            <Plus size={20} strokeWidth={2.5} />
            Weka Tangazo Lako
          </Link>
        </div>
      </div>
    </main>
  );
}
