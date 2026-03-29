/**
 * SEO utility functions and structured data generators
 */

import { SITE_CONFIG, getSiteOrigin } from "./site-config";

export { SITE_CONFIG, getSiteOrigin };

/** Absolute URL for a site path (path must start with `/` or be empty). */
export function absoluteSiteUrl(path: string): string {
  const origin = getSiteOrigin();
  if (!path || path === "/") return `${origin}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}

function sameAsFromSocial(): string[] {
  return (Object.values(SITE_CONFIG.social) as string[]).filter(
    (u) => u.startsWith("http"),
  );
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function getOrganizationSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.alternateName,
    url: `${origin}/`,
    logo: absoluteSiteUrl(SITE_CONFIG.assets.logo),
    description: SITE_CONFIG.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.streetAddress,
      addressLocality: SITE_CONFIG.address.locality,
      addressRegion: SITE_CONFIG.address.region,
      addressCountry: SITE_CONFIG.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.phone,
      contactType: "Customer Service",
      email: SITE_CONFIG.email,
      areaServed: "BD",
      availableLanguage: ["en", "bn"],
    },
    sameAs: sameAsFromSocial(),
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

  const imageUrl = event.image
    ? event.image.startsWith("http")
      ? event.image
      : absoluteSiteUrl(
          event.image.startsWith("/") ? event.image : `/${event.image}`,
        )
    : absoluteSiteUrl(SITE_CONFIG.assets.defaultEventImage);

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
    image: imageUrl,
    organizer: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: `${getSiteOrigin()}/`,
    },
    offers: {
      "@type": "Offer",
      url: event.url.startsWith("http") ? event.url : absoluteSiteUrl(event.url),
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
      item: item.url.startsWith("http") ? item.url : absoluteSiteUrl(item.url),
    })),
  };
}

export type ItemListEventItem = { id: string; title: string };

/**
 * ItemList JSON-LD for an events index (cap length for reasonable payload size).
 */
export function getEventsItemListSchema(events: ItemListEventItem[], maxItems = 20) {
  const slice = events.slice(0, maxItems);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: slice.map((e, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: e.title,
      url: absoluteSiteUrl(`/events/${e.id}`),
    })),
  };
}
