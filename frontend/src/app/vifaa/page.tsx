"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { fetchListings, formatPrice, listingUnit, unitLabel, type Listing } from "@/lib/api";
import SaveImageButton from "@/components/SaveImageButton";
import SocialActions from "@/components/SocialActions";

export default function VifaaPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const res = await fetchListings({ category: "vifaa", status: "active" });
      if (!stop) {
        setItems((res.items || []).filter((item) => item.category === "vifaa"));
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <main className="min-h-screen pb-24" style={{ backgroundColor: "#FFF6ED" }}>
      <header
        className="sticky top-0 z-20 px-4 py-3.5"
        style={{
          backgroundColor: "rgba(255,246,237,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(210,166,121,0.35)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/home"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px solid #3D2415" }}
          >
            <ArrowLeft size={18} color="#2E1A0F" />
          </Link>
          <div>
            <h1 className="font-heading text-lg" style={{ color: "#2E1A0F" }}>Vifaa vya Ujenzi</h1>
            <p className="text-xs" style={{ color: "#5C4033" }}>Simenti, chuma, tofali, mchanga, bati, rangi</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5 pt-6 space-y-5">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} color="#8B5E3C" className="animate-spin" />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-bold" style={{ color: "#2E1A0F" }}>Hakuna vifaa bado</p>
            <Link href="/weka-tangazo" className="btn-primary inline-block mt-4 px-5 py-3 rounded-full text-sm font-semibold">
              Weka Tangazo
            </Link>
          </div>
        )}
        {items.map((item) => {
          const unit = listingUnit(item);
          return (
            <div
              key={item.id}
              className="market-card relative p-5"
            >
              <Link href={`/tangazo/${item.id}`} className="block">
                {item.images?.[0] && (
                  <img src={item.images[0]} alt="" className="w-full h-40 object-cover rounded-[14px] mb-3" />
                )}
                <h2 className="font-heading" style={{ color: "#2E1A0F" }}>{item.title}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} color="#8B5E3C" />
                  <span className="text-xs" style={{ color: "#5C4033" }}>{item.location}{item.city ? `, ${item.city}` : ""}</span>
                </div>
                <p className="font-bold mt-2" style={{ color: "#2E1A0F" }}>
                  TZS {formatPrice(item.price)}
                  {unit ? <span className="text-xs font-normal" style={{ color: "#5C4033" }}> / {unitLabel(unit)}</span> : null}
                </p>
                {item.stock != null && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: "#8B5E3C" }}>
                    Stock: {item.stock}{unit ? ` ${unitLabel(unit)}` : ""}
                  </p>
                )}
              </Link>
              <div className="flex items-center justify-between gap-3 mt-3">
                <SocialActions item={item} />
                <SaveImageButton id={item.id} title={item.title} url={item.images?.[0]} />
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav />
    </main>
  );
}
