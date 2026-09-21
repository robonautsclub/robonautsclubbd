import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo-metadata";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Login",
  robots: NOINDEX_ROBOTS,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
