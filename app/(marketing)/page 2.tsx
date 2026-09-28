import { Metadata } from "next";
import Feed from "@/components/Feed";
import { PAGE_SEO, buildPageMetadata } from "@/lib/seo-metadata";
import {
  getPublicCourses,
  getPublicEvents,
  getPublicHomepageOrgs,
} from "./events/actions";
import { isEventUpcoming } from "@/lib/dateUtils";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  path: "/",
  absoluteTitle: true,
  ogImage: {
    url: SITE_CONFIG.metadata.defaultImage,
    width: 407,
    height: 407,
    alt: SITE_CONFIG.metadata.defaultImageAlt,
  },
});

// ISR: longer window minimizes edge recompute frequency for mostly static content
export const revalidate = 1800;

export default async function Home() {
  const [courses, events, homepageOrgs] = await Promise.all([
    getPublicCourses(),
    getPublicEvents(),
    getPublicHomepageOrgs(),
  ])
  const initialUpcomingEvents = events.filter((e) => isEventUpcoming(e.date))

  return (
    <main id="main" className="flex flex-col w-full min-w-full">
      <Feed
        initialCourses={courses}
        initialUpcomingEvents={initialUpcomingEvents}
        initialPartners={homepageOrgs.partners}
        initialWorkshopSchools={homepageOrgs.schools}
      />
    </main>
  );
}
