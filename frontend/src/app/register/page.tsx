"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Phone, Lock, User } from "lucide-react";
import { register as apiRegister } from "@/lib/api";
import AppAlert, { AlertKind } from "@/components/AppAlert";

const slides = [
  { image: "/poster_nyumba_salama.png", title: "Chumba & Nyumba", subtitle: "Panga salama, bei wazi" },
  { image: "/poster_maduka_godown.png", title: "Store & Godown", subtitle: "Nafasi za biashara" },
  { image: "/poster_vifaa_ujenzi.png", title: "Apartment & Airbnb", subtitle: "Muda mfupi au mwezi" },
  { image: "/poster_mnada_rahisi.png", title: "Frame za Maduka", subtitle: "Anza biashara yako" },
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKind, setAlertKind] = useState<AlertKind>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, []);

  const showAlert = (kind: AlertKind, title: string, message?: string) => {
    setAlertKind(kind);
    setAlertTitle(title);
    setAlertMsg(message || "");
    setAlertOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      showAlert("warning", "Jaza taarifa", "Simu na nenosiri ni lazima.");
      return;
    }
    if (password.length < 6) {
      showAlert("warning", "Nenosiri fupi", "Tumia angalau herufi 6.");
      return;
    }
    setLoading(true);
    try {
      await apiRegister(phone.trim(), password, fullName.trim());
      window.location.href = "/home";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Usajili umeshindikana";
      showAlert("error", "Imeshindikana", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: "#FFF6ED" }}>
      <div className="relative w-full md:w-1/2 h-[38vh] md:h-screen order-1">
        {slides.map((s, i) => (
          <div key={s.image} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }}>
            <Image
              src={s.image}
              alt={s.title}
              fill
              className="object-cover"
              style={{
                transform: slide === i ? "scale(1.08)" : "scale(1)",
                transition: slide === i ? "transform 7s ease-out" : "none",
              }}
              priority={i === 0}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,15,8,0.85), transparent 55%)" }} />
            <div className="absolute bottom-8 left-6 right-6">
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#D2A679" }}>Jengo</p>
              <h2 className="text-2xl font-bold" style={{ color: "#FFF6ED" }}>{s.title}</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,246,237,0.8)" }}>{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-8 order-2">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#2E1A0F" }}>Fungua akaunti</h1>
          <p className="text-sm mb-6" style={{ color: "#5C4033" }}>Jiunge na Jengo Marketplace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Jina kamili</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juma Hassan" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Namba ya simu</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="input-chocolate w-full pl-10 pr-4 py-3.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#2E1A0F" }}>Nenosiri</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#8B5E3C" />
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Angalau herufi 6" className="input-chocolate w-full pl-10 pr-12 py-3.5 text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {show ? <EyeOff size={16} color="#8B5E3C" /> : <Eye size={16} color="#8B5E3C" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-[18px] font-semibold text-sm" style={{ backgroundColor: "#2E1A0F", color: "#FFF6ED", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Inasajili..." : "Jisajili"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#5C4033" }}>
            Una akaunti?{" "}
            <Link href="/login" className="font-bold" style={{ color: "#8B5E3C" }}>Ingia</Link>
          </p>
        </div>
      </div>

      <AppAlert open={alertOpen} kind={alertKind} title={alertTitle} message={alertMsg} onClose={() => setAlertOpen(false)} />
    </main>
  );
}
