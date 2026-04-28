import { Metadata } from "next";
import Feed from "@/components/Feed";
import { SITE_CONFIG } from "@/lib/site-config";
import { getPublicCourses, getPublicEvents } from "@/app/events/actions";
import { isEventUpcoming } from "@/lib/dateUtils";

export const metadata: Metadata = {
  title: "Home",
  description: SITE_CONFIG.extendedDescription,
  keywords: [...SITE_CONFIG.metadata.keywords],
  openGraph: {
    title: SITE_CONFIG.metadata.defaultTitle,
    description: SITE_CONFIG.extendedDescription,
    url: "/",
    images: [
      {
        url: SITE_CONFIG.metadata.defaultImage,
        width: 407,
        height: 407,
        alt: `${SITE_CONFIG.name} logo`,
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

// ISR: longer window minimizes edge recompute frequency for mostly static content
export const revalidate = 1800;

export default async function Home() {
  const [courses, events] = await Promise.all([
    getPublicCourses(),
    getPublicEvents(),
  ])
  const initialUpcomingEvents = events.filter((e) => isEventUpcoming(e.date))

  return (
    <main className="flex flex-col w-full min-w-full">
      <Feed
        initialCourses={courses}
        initialUpcomingEvents={initialUpcomingEvents}
      />
    </main>
  );
}
