import Link from "next/link";
import NextImage from "next/image";
import SignedInHome from "@/components/SignedInHome";

const categories = [
  { href: "/nyumba", title: "Rooms & Houses", line: "Monthly or yearly stays", img: "/real/room.jpg" },
  { href: "/airbnb", title: "Apartment & Airbnb", line: "Apartments by the night", img: "/real/apartment.jpg" },
  { href: "/godown", title: "Shops Store & Godown", line: "Storage space, not shop frames", img: "/real/shop.jpg" },
  { href: "/maduka", title: "Shop Frames", line: "Shop frames for rent", img: "/real/shop.jpg" },
  { href: "/vifaa", title: "Building Materials", line: "Cement, steel, bricks", img: "/real/materials.jpg" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)" }}>
      <SignedInHome />
      <header className="topbar px-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <p className="text-[22px] font-bold leading-none tracking-tight" style={{ color: "var(--ink)" }}>
            Jengo
          </p>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold rounded-full" style={{ color: "var(--ink)" }}>
              Log in
            </Link>
            <Link href="/register" className="btn-primary px-4 py-2.5 text-sm font-semibold">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 pt-6 pb-16">
        <p className="text-[12px] font-semibold" style={{ color: "var(--mocha)" }}>
          Tanzania
        </p>
        <h1 className="text-[40px] sm:text-[52px] font-bold leading-[1.02] tracking-tight mt-1 max-w-[12ch]" style={{ color: "var(--ink)" }}>
          Calm places to live
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Houses, Airbnb, shop frames and building materials. Clear prices, real photos.
        </p>

        <div className="estate-card mt-6">
          <div className="relative" style={{ height: 240 }}>
            <NextImage src="/real/apartment.jpg" alt="Homes on Jengo" fill className="object-cover" priority sizes="(min-width: 768px) 768px, 100vw" />
          </div>
          <div className="px-5 py-4">
            <p className="text-[20px] font-bold leading-snug" style={{ color: "var(--ink)" }}>
              Places to live and work
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              See a photo, a price, and a location before you write.
            </p>
            <div className="flex gap-2 mt-4">
              <Link href="/login" className="btn-primary px-5 py-3 text-sm font-semibold">
                Log in
              </Link>
              <Link href="/register" className="btn-secondary px-5 py-3 text-sm font-semibold">
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="estate-card block">
              <div className="estate-card-media relative">
                <NextImage src={c.img} alt="" fill className="object-cover" sizes="(min-width: 640px) 360px, 100vw" />
              </div>
              <div className="px-4 pt-3.5 pb-4">
                <p className="text-[18px] font-bold leading-snug" style={{ color: "var(--ink)" }}>
                  {c.title}
                </p>
                <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
                  {c.line}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
