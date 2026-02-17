import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalLayout from "./ConditionalLayout";
import OrganizationSchema from "@/components/OrganizationSchema";
import { getOrganizationSchema } from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
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
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.metadata.defaultImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
