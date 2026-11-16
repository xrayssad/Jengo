import JengoLogo from "@/components/JengoLogo";
import { USE_NEW_LOGO } from "@/lib/logo";

export default function Brand({
  variant = "wordmark",
  size = 26,
  className = "",
}: {
  variant?: "wordmark" | "mark" | "icon" | "lockup";
  size?: number;
  className?: string;
}) {
  if (!USE_NEW_LOGO) {
    return <span className={["brand-fallback", className].filter(Boolean).join(" ")}>Jengo</span>;
  }
  return <JengoLogo variant={variant} size={size} title="" className={className} />;
}
