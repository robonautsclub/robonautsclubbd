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
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - Robotics Education in Bangladesh`,
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

// Keep home hero “next event” strip reasonably fresh (matches /events ISR)
export const revalidate = 60;

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
