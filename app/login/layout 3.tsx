import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Login",
  robots: NOINDEX_ROBOTS,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
