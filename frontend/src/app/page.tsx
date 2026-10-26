import Link from "next/link";
import NextImage from "next/image";

const categories = [
  { href: "/nyumba", title: "Houses / Rooms", line: "Monthly or yearly stays", img: "/real/room.jpg" },
  { href: "/godown", title: "Godown / Store", line: "Storage space, not shop frames", img: "/real/shop.jpg" },
  { href: "/airbnb", title: "Airbnb", line: "Apartments by the night", img: "/real/apartment.jpg" },
  { href: "/maduka", title: "Shop frames", line: "Shop frames for rent", img: "/real/shop.jpg" },
  { href: "/vifaa", title: "Building materials", line: "Cement, steel, bricks", img: "/real/materials.jpg" },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden" style={{ backgroundColor: "#2E1A0F" }}>
      <section className="relative h-dvh min-h-[640px]">
        <NextImage src="/real/apartment.jpg" alt="Homes" fill className="object-cover" priority sizes="100vw" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(46,26,15,0.62) 0%, rgba(46,26,15,0.12) 28%, rgba(46,26,15,0.22) 58%, rgba(46,26,15,0.92) 100%)",
          }}
        />

        <header className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between px-6 md:px-16 py-6 max-w-6xl mx-auto">
            <p className="font-heading text-[30px] md:text-[36px] leading-none" style={{ color: "#C4A35A" }}>
              Jengo
            </p>
            <div className="flex items-center gap-4 md:gap-7 shrink-0">
              <Link href="/login" className="hidden sm:inline text-sm" style={{ color: "#C4A35A" }}>
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex text-sm px-3 py-1.5 md:px-5 md:py-2"
                style={{ color: "#C4A35A", border: "1px solid #C4A35A" }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 md:px-16 pb-14 md:pb-24 max-w-6xl mx-auto">
          <div className="gold-rule w-16 mb-6" />
          <h1
            className="font-heading text-[52px] sm:text-[72px] md:text-[96px] leading-[0.94] max-w-[10ch]"
            style={{ color: "#FFF6ED" }}
          >
            Calm places to live
          </h1>
          <p className="mt-6 max-w-sm md:max-w-md text-[15px] md:text-lg leading-relaxed" style={{ color: "#D2A679" }}>
            Houses, Airbnb, shop frames and building materials. Clear prices, real photos.
          </p>
          <Link
            href="/login"
            className="inline-flex mt-9 px-9 py-3.5 text-sm font-semibold"
            style={{ backgroundColor: "#C4A35A", color: "#2E1A0F" }}
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="px-6 md:px-16 py-20 md:py-28" style={{ backgroundColor: "var(--paper)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="gold-rule w-12 mx-auto mb-8" />
          <p className="font-heading text-[32px] md:text-[44px] leading-[1.15]" style={{ color: "var(--ink)" }}>
            Rooms, apartments, shops and materials — in one place.
          </p>
          <p className="mt-6 text-[15px] md:text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            Jengo connects you with owners, quietly. See photos and prices, then send a request.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2">
        {categories.map((c) => (
          <Link key={c.href} href={c.href} className="estate-tile relative min-h-[320px] md:min-h-[52vh] overflow-hidden">
            <NextImage src={c.img} alt={c.title} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(46,26,15,0.82), rgba(46,26,15,0.08) 58%)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-7 md:p-10">
              <div className="gold-rule w-10 mb-4" />
              <h2 className="font-heading text-4xl md:text-5xl leading-none" style={{ color: "#FFF6ED" }}>
                {c.title}
              </h2>
              <p className="mt-3 text-sm" style={{ color: "#D2A679" }}>
                {c.line}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <footer className="px-6 md:px-16 py-12 max-w-6xl mx-auto flex items-center justify-between">
        <p className="font-heading text-3xl" style={{ color: "#C4A35A" }}>
          Jengo
        </p>
        <Link href="/register" className="text-sm" style={{ color: "#C4A35A" }}>
          Create account
        </Link>
      </footer>
    </main>
  );
}
