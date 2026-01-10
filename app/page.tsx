import { Metadata } from "next";
import Feed from "@/components/Feed";
import { SITE_CONFIG } from "@/lib/seo";
import { getPublicCourses } from "@/app/events/actions";

export const metadata: Metadata = {
  title: "Home",
  description: "Join Bangladesh's premier youth robotics club. Hands-on robotics workshops, STEM training, competitions, and international opportunities for students. 500+ active members learning robotics, coding, AI, and electronics.",
  keywords: [
    "robotics Bangladesh",
    "STEM education",
    "robotics workshop",
    "youth robotics",
    "Robofest",
    "robotics training",
    "coding workshop",
    "AI education",
  ],
  openGraph: {
    title: "Robonauts Club | Bangladesh's Premier Youth Robotics & STEM Education",
    description: "Join Bangladesh's premier youth robotics club. Hands-on robotics workshops, STEM training, competitions, and international opportunities.",
    url: "/",
    images: [
      {
        url: "/robobanner.gif",
        width: 1200,
        height: 630,
        alt: "Robonauts Club - Robotics Education in Bangladesh",
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
