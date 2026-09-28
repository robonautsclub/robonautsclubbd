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
import {
  ROBOFEST_CATEGORIES,
  getRobofestRoundStartDateIso,
} from "@/lib/robofest-local";
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
  const brand = "Robonauts Club";

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
      title: `${category.name} | Robofest Bangladesh | ${brand}`,
      description: category.about || category.description,
      url: getRobofestCategoryHref(category.slug),
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${category.name} — Robofest Bangladesh 2026`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Robofest Bangladesh | ${brand}`,
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
  const activeCategories = getActiveRobofestCategories(content);
  const activeSlugs = activeCategories.map((c) => c.slug);
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

  const rounds = content.rounds?.length ? content.rounds : [];
  const eventSchemas = (rounds.length > 0 ? rounds : [null]).map(
    (round, index) => {
      const city = round?.city || "Bangladesh";
      const startIso = round
        ? getRobofestRoundStartDateIso(round.city)
        : undefined;
      const cityKey = city.toLowerCase().replace(/\s+/g, "-");
      return getEventSchema({
        id: `robofest-${category.slug}-${cityKey}-${index}`,
        title: `${category.name} · ${content.headline || "Robofest Bangladesh 2026"}${
          round?.city ? ` · ${round.city}` : ""
        }`,
        description: category.about || category.description,
        date:
          startIso ||
          round?.dates ||
          content.dateLabel ||
          content.dateLines?.[0] ||
          "",
        location: city,
        venue: round?.venueLabel || content.venueLabel,
        image,
        url: absoluteSiteUrl(categoryUrl),
        price: fee.isPaid ? fee.amount : 0,
        priceCurrency: "BDT",
      });
    },
  );

  return (
    <>
      <Script
        id={`robofest-${category.slug}-breadcrumb-jsonld`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {eventSchemas.map((schema, index) => (
        <Script
          key={`robofest-${category.slug}-event-${index}`}
          id={`robofest-${category.slug}-event-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <RobofestCategoryPage
        category={category}
        content={content}
        fee={fee}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
        siblingCategories={activeCategories.filter((c) => c.slug !== slug)}
      />
    </>
  );
}
