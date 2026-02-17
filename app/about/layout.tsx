import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${SITE_CONFIG.name} - Bangladesh's first youth robotics club. Discover our mission, values, achievements, and how we're preparing students for Robofest and global STEM challenges. 500+ active members, 50+ events, 15+ competition awards.`,
  keywords: [
    `about ${SITE_CONFIG.name}`,
    "robotics club Bangladesh",
    "STEM education mission",
    "robotics training center",
    "youth development Bangladesh",
    "Robofest preparation",
  ],
  openGraph: {
    title: `${SITE_CONFIG.name} | Bangladesh's Premier Robotics Education`,
    description: `Learn about ${SITE_CONFIG.name} - Bangladesh's first youth robotics club preparing students for global STEM challenges.`,
    url: "/about",
    images: [
      {
        url: "/roboclass.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - About Us`,
      },
    ],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

