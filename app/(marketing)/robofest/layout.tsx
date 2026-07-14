import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Robofest Bangladesh Local Round",
  description:
    "Robofest Bangladesh Local Round 2026 in Dhaka (4–5 Sep) and Chittagong (11–12 Sep), hosted by Robonauts Ltd. Compete in BottleSumo, Game, Exhibition, and more—qualify toward the World Championship at Lawrence Technological University.",
  keywords: [
    "Robofest Bangladesh",
    "Robofest local round",
    "Robofest Dhaka",
    "Robofest Chittagong",
    "BottleSumo Bangladesh",
    "robotics competition Dhaka",
    "Robonauts Robofest",
    "Lawrence Technological University Robofest",
  ],
  openGraph: {
    title: `Robofest Bangladesh Local Round | ${SITE_CONFIG.name}`,
    description:
      "Compete in Dhaka and Chittagong at the Robofest local rounds hosted by Robonauts. Path to the World Championship at LTU, USA.",
    url: "/robofest",
    images: [
      {
        url: "/olympiads/robofest.png",
        width: 1200,
        height: 630,
        alt: "Robofest Bangladesh Local Round",
      },
    ],
  },
  alternates: {
    canonical: "/robofest",
  },
};

export default function RobofestLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
