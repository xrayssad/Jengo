import Link from "next/link";
import NextImage from "next/image";

const categories = [
  { href: "/nyumba", title: "Nyumba/Chumba", line: "Makazi ya mwezi au mwaka", img: "/real/room.jpg" },
  { href: "/godown", title: "Godown/Store", line: "Hifadhi na store, si maduka", img: "/real/shop.jpg" },
  { href: "/airbnb", title: "Airbnb", line: "Apartment kwa usiku", img: "/real/apartment.jpg" },
  { href: "/maduka", title: "Maduka", line: "Frame za maduka", img: "/real/shop.jpg" },
  { href: "/vifaa", title: "Vifaa", line: "Simenti, chuma, tofali", img: "/real/materials.jpg" },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden" style={{ backgroundColor: "#2E1A0F" }}>
      <section className="relative h-dvh min-h-[640px]">
        <NextImage src="/real/apartment.jpg" alt="Makazi" fill className="object-cover" priority sizes="100vw" />
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
                Ingia
              </Link>
              <Link
                href="/register"
                className="inline-flex text-sm px-3 py-1.5 md:px-5 md:py-2"
                style={{ color: "#C4A35A", border: "1px solid #C4A35A" }}
              >
                Jisajili
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
            Makazi yenye utulivu
          </h1>
          <p className="mt-6 max-w-sm md:max-w-md text-[15px] md:text-lg leading-relaxed" style={{ color: "#D2A679" }}>
            Nyumba, Airbnb, maduka na vifaa vya ujenzi. Bei wazi, picha halisi.
          </p>
          <Link
            href="/login"
            className="inline-flex mt-9 px-9 py-3.5 text-sm font-semibold"
            style={{ backgroundColor: "#C4A35A", color: "#2E1A0F" }}
          >
            Ingia
          </Link>
        </div>
      </section>

      <section className="px-6 md:px-16 py-20 md:py-28" style={{ backgroundColor: "#FFF6ED" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="gold-rule w-12 mx-auto mb-8" />
          <p className="font-heading text-[32px] md:text-[44px] leading-[1.15]" style={{ color: "#2E1A0F" }}>
            Chumba, apartment, duka na vifaa — mahali pamoja.
          </p>
          <p className="mt-6 text-[15px] md:text-base leading-relaxed" style={{ color: "#5C4033" }}>
            Jengo inakutanisha na mwenye mali bila kelele. Unaona picha, bei, kisha unaomba.
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
          Fungua akaunti
        </Link>
      </footer>
    </main>
  );
}
