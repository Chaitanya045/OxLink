import { Navbar } from "./Navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function NavbarWrapper() {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  const pathname = hdrs.get("next-url") || "";
  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) {
    return null;
  }

  return <Navbar isLoggedIn={!!session} />;
}
