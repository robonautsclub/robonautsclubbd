import { Metadata } from "next";
import Feed from "@/components/Feed";
import { SITE_CONFIG } from "@/lib/site-config";
import { getPublicCourses } from "@/app/events/actions";

export const metadata: Metadata = {
  title: "Home",
  description: SITE_CONFIG.extendedDescription,
  keywords: SITE_CONFIG.metadata.keywords,
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

export default async function Home() {
  // Fetch courses from Firestore (non-archived only)
  const courses = await getPublicCourses()

  return (
    <main className="flex flex-col w-full min-w-full">
      <Feed initialCourses={courses} />
    </main>
  );
}
