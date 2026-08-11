import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getPublicEnglishMediumSchools } from "@/app/(marketing)/events/actions";
import { getPublicRobofestCampusAmbassadors } from "@/lib/robofest-campus-ambassadors-db";
import {
  getActiveRobofestCategories,
  getRobofestCategoryFromContent,
  getRobofestCategoryHref,
  getRobofestCategoryImage,
  getRobofestContent,
  resolveRobofestFee,
} from "@/lib/robofest-content";
import { ROBOFEST_CATEGORIES } from "@/lib/robofest-local";
import {
  absoluteSiteUrl,
  getBreadcrumbSchema,
  getEventSchema,
} from "@/lib/seo";
import { SITE_CONFIG } from "@/lib/site-config";
import RobofestCategoryPage from "@/components/RobofestCategoryPage";

// ISR: align with other marketing pages; content updates call revalidatePath/Tag
export const revalidate = 1800;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ROBOFEST_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await getRobofestContent();
  const category = getRobofestCategoryFromContent(content, slug);
  if (!category) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const image = getRobofestCategoryImage(category);
  const descriptionBase =
    category.about?.trim() || category.description?.trim() || category.name;
  const description = `${descriptionBase} Local rounds: Chittagong 11 Sep & Dhaka 18 Sep. Register with ${SITE_CONFIG.name}.`;
  const title = `${category.name} · Robofest Bangladesh 2026`;

  return {
    title,
    description,
    keywords: [
      category.name,
      "Robofest Bangladesh",
      "Robofest 2026",
      "Dhaka",
      "Chittagong",
      category.skillLevel,
      category.format,
      "robotics competition Bangladesh",
      SITE_CONFIG.name,
    ].filter(Boolean),
    openGraph: {
      title: `${category.name} | Robofest Bangladesh | ${SITE_CONFIG.name}`,
      description: category.about || category.description,
      url: getRobofestCategoryHref(category.slug),
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Robofest Bangladesh`,
      description: category.description || category.about,
      images: [image],
    },
    alternates: {
      canonical: getRobofestCategoryHref(category.slug),
    },
  };
}

export default async function RobofestCategoryRoute({ params }: PageProps) {
  const { slug } = await params;
  const content = await getRobofestContent();
  const category = getRobofestCategoryFromContent(content, slug);
  if (!category) {
    notFound();
  }

  const fee = resolveRobofestFee(content, category.name);
  const activeSlugs = getActiveRobofestCategories(content).map((c) => c.slug);
  if (!activeSlugs.includes(slug)) {
    notFound();
  }

  const schools = await getPublicEnglishMediumSchools();
  const campusAmbassadors = await getPublicRobofestCampusAmbassadors();
  const image = getRobofestCategoryImage(category);
  const categoryUrl = getRobofestCategoryHref(category.slug);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Robofest Bangladesh", url: "/robofest" },
    { name: category.name, url: categoryUrl },
  ]);

  const primaryRound = content.rounds[0];
  const eventSchema = getEventSchema({
    id: `robofest-${category.slug}`,
    title: `${category.name} · ${content.headline || "Robofest Bangladesh 2026"}`,
    description: category.about || category.description,
    date: primaryRound?.dates || content.dateLabel || content.dateLines?.[0] || "",
    location: primaryRound?.city || "Bangladesh",
    venue: primaryRound?.venueLabel || content.venueLabel,
    image,
    url: absoluteSiteUrl(categoryUrl),
  });

  return (
    <>
      <Script
        id={`robofest-${category.slug}-breadcrumb-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id={`robofest-${category.slug}-event-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <RobofestCategoryPage
        category={category}
        content={content}
        fee={fee}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
      />
    </>
  );
}
