import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OrganizationSchema from "@/components/OrganizationSchema";
import ConditionalAnalytics from "@/components/ConditionalAnalytics";
import { SITE_CONFIG, getSiteOrigin } from "@/lib/site-config";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`${getSiteOrigin()}/`),
  title: {
    default: SITE_CONFIG.metadata.defaultTitle,
    template: SITE_CONFIG.metadata.titleTemplate
  },
  description: SITE_CONFIG.metadata.defaultDescription,
  keywords: [...SITE_CONFIG.metadata.keywords],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
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
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.metadata.defaultTitle,
    description: SITE_CONFIG.metadata.defaultDescription,
    images: [
      {
        url: SITE_CONFIG.metadata.defaultImage,
        width: 407,
        height: 407,
        alt: SITE_CONFIG.metadata.defaultImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_CONFIG.metadata.defaultTitle,
    description: SITE_CONFIG.metadata.defaultDescription,
    images: [SITE_CONFIG.metadata.defaultImage],
    creator: SITE_CONFIG.metadata.twitterCreator,
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
  },
  icons: {
    icon: "/favicon.ico",
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
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}
      >
        <ConditionalAnalytics />
        <OrganizationSchema />
        {children}
      </body>
    </html>
  );
}
