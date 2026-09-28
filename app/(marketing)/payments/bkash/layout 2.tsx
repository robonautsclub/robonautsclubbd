import type { Metadata } from "next";
import { NOINDEX_ROBOTS } from "@/lib/seo-metadata";

export const metadata: Metadata = {
  title: "Payment",
  robots: NOINDEX_ROBOTS,
};

export default function BkashPaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
