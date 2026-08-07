import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveRobofestCategories,
  getRobofestCategoryFromContent,
  getRobofestContent,
  resolveRobofestFee,
} from "@/lib/robofest-content";
import { ROBOFEST_CATEGORIES } from "@/lib/robofest-local";
import { SITE_CONFIG } from "@/lib/site-config";
import RobofestCategoryPage from "@/components/RobofestCategoryPage";

export const dynamic = "force-dynamic";

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
    return { title: "Category not found" };
  }

  return {
    title: `${category.name} · Robofest Bangladesh`,
    description: category.description,
    openGraph: {
      title: `${category.name} | Robofest Bangladesh | ${SITE_CONFIG.name}`,
      description: category.description,
      url: `/robofest/${category.slug}`,
    },
    alternates: {
      canonical: `/robofest/${category.slug}`,
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

  return (
    <RobofestCategoryPage
      category={category}
      content={content}
      fee={fee}
    />
  );
}
