import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { SHOW_LANDING_PAGE } from "@/lib/productFlags";

export default function IndexPage() {
  if (!SHOW_LANDING_PAGE) redirect("/home");
  return <LandingPage />;
}
