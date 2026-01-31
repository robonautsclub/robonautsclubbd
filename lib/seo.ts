/**
 * SEO utility functions and structured data generators
 */

export const SITE_CONFIG = {
  name: "Robonauts Club",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://robonautsclub.com",
  description: "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges.",
  email: "info@robonautsclub.com",
  phone: "+8801824863366",
  location: "5B, House #4, Road #7, Sector #3, Uttara",
  social: {
    facebook: "https://www.facebook.com/robonautsclub",
    instagram: "https://www.instagram.com/robonauts_club",
    whatsapp: "https://wa.me/8801824863366",
  },
};

/**
 * Generate Organization structured data (JSON-LD)
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_CONFIG.name,
    alternateName: "Robonauts Club Bangladesh",
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/robologo.jpg`,
    description: SITE_CONFIG.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "5B, House #4, Road #7, Sector #3",
      addressLocality: "Uttara",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.phone,
      contactType: "Customer Service",
      email: SITE_CONFIG.email,
      areaServed: "BD",
      availableLanguage: ["en", "bn"],
    },
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.whatsapp,
    ],
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
  };
}

/**
 * Generate Event structured data (JSON-LD)
 */
export function getEventSchema(event: {
  id: string;
  title: string;
  description: string;
  date: string | string[];
  time?: string;
  location: string;
  venue?: string;
  image?: string;
  url: string;
}) {
  // Handle both single date string and multiple dates (use first date for schema)
  const dateValue = Array.isArray(event.date) 
    ? event.date.length > 0 ? event.date[0] : ''
    : typeof event.date === 'string' && event.date.includes(',')
    ? event.date.split(',')[0].trim()
    : event.date || ''
  
  const startDate = event.time
    ? `${dateValue}T${event.time}:00`
    : `${dateValue}T00:00:00`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue || event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.location,
        addressCountry: "BD",
      },
    },
    image: event.image
      ? event.image.startsWith("http")
        ? event.image
        : `${SITE_CONFIG.url}${event.image}`
      : `${SITE_CONFIG.url}/robotics-event.jpg`,
    organizer: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    offers: {
      "@type": "Offer",
      url: event.url,
      price: "0",
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

