import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalLayout from "./ConditionalLayout";
import OrganizationSchema from "@/components/OrganizationSchema";
import { getOrganizationSchema } from "@/lib/seo";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://robonautsclub.com'),
  title: {
    default: "Robonauts Club | Bangladesh's Premier Youth Robotics & STEM Education",
    template: "%s | Robonauts Club"
  },
  description: "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges. Join 500+ members for hands-on robotics workshops, competitions, and international opportunities.",
  keywords: [
    "robotics Bangladesh",
    "STEM education Bangladesh",
    "Robofest Bangladesh",
    "youth robotics club",
    "robotics workshop Dhaka",
    "STEM training Bangladesh",
    "robotics competition Bangladesh",
    "robotics education",
    "coding workshop Bangladesh",
    "AI education Bangladesh",
    "electronics training",
    "robotics for kids",
    "robotics for students",
    "robotics club Dhaka",
    "STEM club Bangladesh"
  ],
  authors: [{ name: "Robonauts Club" }],
  creator: "Robonauts Club",
  publisher: "Robonauts Club",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    url: "/",
    siteName: "Robonauts Club",
    title: "Robonauts Club | Bangladesh's Premier Youth Robotics & STEM Education",
    description: "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges. Join 500+ members for hands-on robotics workshops, competitions, and international opportunities.",
    images: [
      {
        url: "/robobanner.gif",
        width: 1200,
        height: 630,
        alt: "Robonauts Club - Bangladesh's Premier Youth Robotics Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Robonauts Club | Bangladesh's Premier Youth Robotics & STEM Education",
    description: "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges.",
    images: ["/robobanner.gif"],
    creator: "@robonauts_club",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      'en-US': '/en',
      'bn-BD': '/bn',
    },
  },
  category: "Education",
  classification: "Robotics Education, STEM Training, Youth Development",
  other: {
    'geo.region': 'BD',
    'geo.placename': 'Dhaka',
    'geo.position': '23.8103;90.4125',
    'ICBM': '23.8103, 90.4125',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  

  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X87SJ4G3R7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X87SJ4G3R7');
          `}
        </Script>
        <OrganizationSchema />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
