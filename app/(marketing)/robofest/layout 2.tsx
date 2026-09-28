import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PAGE_SEO, buildPageMetadata } from "@/lib/seo-metadata";

const ogImage = "/robofest/robofest.jpg";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_SEO.robofest.title,
  description: PAGE_SEO.robofest.description,
  path: "/robofest",
  absoluteTitle: true,
  ogImage: {
    url: ogImage,
    width: 1200,
    height: 630,
    alt: "Robofest Bangladesh 2026 Local Round",
  },
  keywords: [
    "Robofest Bangladesh 2026",
    "Robofest local round",
    "Robofest Dhaka",
    "Robofest Chittagong",
    "BottleSumo Bangladesh",
    "BuildAthon Bangladesh",
    "Line Following Bot",
    "Robo Exhibition",
    "robotics competition Dhaka",
    "Robonauts Robofest",
    "Robofest South Korea 2027",
  ],
});

export default function RobofestLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
