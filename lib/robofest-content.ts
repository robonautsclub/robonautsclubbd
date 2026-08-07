/**
 * Firestore-backed Robofest content with static seed fallback.
 * Collection: robofestContent / doc: settings
 */

import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  ROBOFEST_CATEGORIES,
  ROBOFEST_HOW_IT_WORKS,
  ROBOFEST_LOCAL,
} from "@/lib/robofest-local";

export const ROBOFEST_CONTENT_COLLECTION = "robofestContent";
export const ROBOFEST_CONTENT_DOC_ID = "settings";
export const ROBOFEST_CONTENT_CACHE_TAG = "robofest-content";
export const ROBOFEST_REGISTRATIONS_COLLECTION = "robofestRegistrations";

export type RobofestRoundContent = {
  city: string;
  title: string;
  dates: string;
  venueLabel: string;
  image: string;
};

export type RobofestCategoryContent = {
  slug: string;
  name: string;
  icon: string;
  image?: string;
  description: string;
  skillLevel: string;
  format: string;
  about: string;
  highlights: string[];
  whoShouldJoin: string;
  rulesPdf?: string;
  active: boolean;
  amount?: number | null;
};

/** Fallback cover art when CMS content has no image yet. */
export const ROBOFEST_CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  bottlesumo: "/robofest/robofest.jpg",
  buildathon: "/roboclass.jpg",
  "line-following-bot": "/feed/robotics.jpg",
  "robo-exhibition": "/olympiads/robofest.png",
};

export function getRobofestCategoryImage(
  category: Pick<RobofestCategoryContent, "slug" | "image">,
): string {
  if (category.image?.trim()) return category.image.trim();
  return (
    ROBOFEST_CATEGORY_IMAGE_FALLBACKS[category.slug] ||
    "/olympiads/robofest.png"
  );
}

export type RobofestHowItWorksStep = {
  icon: string;
  title: string;
  description: string;
};

export type RobofestContent = {
  statusBadge: string;
  headline: string;
  lead: string;
  dateLabel: string;
  timeLabel: string | null;
  venueLabel: string;
  venueDetail: string;
  hostName: string;
  officialSite: string;
  categoriesUrl: string;
  contactHref: string;
  placeholders: {
    schedule: string;
    roundAccent: string;
  };
  rounds: RobofestRoundContent[];
  categories: RobofestCategoryContent[];
  howItWorks: RobofestHowItWorksStep[];
  isPaid: boolean;
  amount: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type RobofestRegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export type RobofestPaymentStatus = "unpaid" | "paid" | "n/a";

export type RobofestRegistration = {
  id: string;
  category: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  roundCity: string;
  notes: string;
  status: RobofestRegistrationStatus;
  registrationId?: string;
  paymentStatus?: RobofestPaymentStatus;
  paymentGateway?: string;
  paymentId?: string;
  trxId?: string;
  amountPaid?: number;
  paidAt?: string | null;
  emailSent?: boolean;
  pdfUrl?: string | null;
  pdfGenerated?: boolean;
  adminNotes?: string;
  createdAt: string | null;
};

function seedCategories(): RobofestCategoryContent[] {
  return ROBOFEST_CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    image: "image" in category ? category.image : undefined,
    description: category.description,
    skillLevel: category.skillLevel,
    format: category.format,
    about: category.about,
    highlights: [...category.highlights],
    whoShouldJoin: category.whoShouldJoin,
    rulesPdf: "rulesPdf" in category ? category.rulesPdf : undefined,
    active: true,
    amount: null,
  }));
}

export function getDefaultRobofestContent(): RobofestContent {
  return {
    statusBadge: ROBOFEST_LOCAL.statusBadge,
    headline: ROBOFEST_LOCAL.headline,
    lead: ROBOFEST_LOCAL.lead,
    dateLabel: ROBOFEST_LOCAL.dateLabel,
    timeLabel: ROBOFEST_LOCAL.timeLabel,
    venueLabel: ROBOFEST_LOCAL.venueLabel,
    venueDetail: ROBOFEST_LOCAL.venueDetail,
    hostName: ROBOFEST_LOCAL.hostName,
    officialSite: ROBOFEST_LOCAL.officialSite,
    categoriesUrl: ROBOFEST_LOCAL.categoriesUrl,
    contactHref: ROBOFEST_LOCAL.contactHref,
    placeholders: {
      schedule: ROBOFEST_LOCAL.placeholders.schedule,
      roundAccent: ROBOFEST_LOCAL.placeholders.roundAccent,
    },
    rounds: ROBOFEST_LOCAL.rounds.map((round) => ({ ...round })),
    categories: seedCategories(),
    howItWorks: ROBOFEST_HOW_IT_WORKS.map((step) => ({ ...step })),
    isPaid: false,
    amount: 0,
    updatedAt: null,
    updatedBy: null,
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return null;
}

function normalizeCategory(
  raw: Record<string, unknown>,
  fallback?: RobofestCategoryContent,
): RobofestCategoryContent {
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.filter((h): h is string => typeof h === "string")
    : (fallback?.highlights ?? []);

  const amountRaw = raw.amount;
  const amount =
    amountRaw == null || amountRaw === ""
      ? null
      : asNumber(amountRaw, fallback?.amount ?? 0);

  return {
    slug: asString(raw.slug, fallback?.slug ?? ""),
    name: asString(raw.name, fallback?.name ?? ""),
    icon: asString(raw.icon, fallback?.icon ?? "smart_toy"),
    image: raw.image
      ? asString(raw.image)
      : fallback?.image ||
        ROBOFEST_CATEGORY_IMAGE_FALLBACKS[asString(raw.slug, fallback?.slug ?? "")],
    description: asString(raw.description, fallback?.description ?? ""),
    skillLevel: asString(raw.skillLevel, fallback?.skillLevel ?? ""),
    format: asString(raw.format, fallback?.format ?? ""),
    about: asString(raw.about, fallback?.about ?? ""),
    highlights,
    whoShouldJoin: asString(raw.whoShouldJoin, fallback?.whoShouldJoin ?? ""),
    rulesPdf: raw.rulesPdf ? asString(raw.rulesPdf) : fallback?.rulesPdf,
    active: asBool(raw.active, fallback?.active ?? true),
    amount,
  };
}

export function mapRobofestContentDoc(
  data: Record<string, unknown>,
): RobofestContent {
  const defaults = getDefaultRobofestContent();
  const roundsRaw = Array.isArray(data.rounds) ? data.rounds : defaults.rounds;
  const categoriesRaw = Array.isArray(data.categories)
    ? data.categories
    : defaults.categories;
  const howItWorksRaw = Array.isArray(data.howItWorks)
    ? data.howItWorks
    : defaults.howItWorks;

  const placeholdersRaw =
    data.placeholders && typeof data.placeholders === "object"
      ? (data.placeholders as Record<string, unknown>)
      : {};

  return {
    statusBadge: asString(data.statusBadge, defaults.statusBadge),
    headline: asString(data.headline, defaults.headline),
    lead: asString(data.lead, defaults.lead),
    dateLabel: asString(data.dateLabel, defaults.dateLabel),
    timeLabel:
      data.timeLabel === null
        ? null
        : asString(data.timeLabel, defaults.timeLabel ?? ""),
    venueLabel: asString(data.venueLabel, defaults.venueLabel),
    venueDetail: asString(data.venueDetail, defaults.venueDetail),
    hostName: asString(data.hostName, defaults.hostName),
    officialSite: asString(data.officialSite, defaults.officialSite),
    categoriesUrl: asString(data.categoriesUrl, defaults.categoriesUrl),
    contactHref: asString(data.contactHref, defaults.contactHref),
    placeholders: {
      schedule: asString(
        placeholdersRaw.schedule,
        defaults.placeholders.schedule,
      ),
      roundAccent: asString(
        placeholdersRaw.roundAccent,
        defaults.placeholders.roundAccent,
      ),
    },
    rounds: roundsRaw.map((round) => {
      const r = round as Record<string, unknown>;
      return {
        city: asString(r.city),
        title: asString(r.title),
        dates: asString(r.dates),
        venueLabel: asString(r.venueLabel),
        image: asString(r.image, "/robofest/dhaka.jpg"),
      };
    }),
    categories: categoriesRaw.map((category, index) =>
      normalizeCategory(
        category as Record<string, unknown>,
        defaults.categories[index],
      ),
    ),
    howItWorks: howItWorksRaw.map((step) => {
      const s = step as Record<string, unknown>;
      return {
        icon: asString(s.icon, "group"),
        title: asString(s.title),
        description: asString(s.description),
      };
    }),
    isPaid: asBool(data.isPaid, defaults.isPaid),
    amount: asNumber(data.amount, defaults.amount),
    updatedAt: toIso(data.updatedAt),
    updatedBy: data.updatedBy ? asString(data.updatedBy) : null,
  };
}

export function mapRobofestRegistrationDoc(
  id: string,
  data: Record<string, unknown>,
): RobofestRegistration {
  const statusRaw = asString(data.status, "pending");
  const status: RobofestRegistrationStatus =
    statusRaw === "confirmed" || statusRaw === "cancelled"
      ? statusRaw
      : "pending";

  const paymentRaw = asString(data.paymentStatus, "");
  const paymentStatus: RobofestPaymentStatus | undefined =
    paymentRaw === "paid" || paymentRaw === "unpaid" || paymentRaw === "n/a"
      ? paymentRaw
      : undefined;

  return {
    id,
    category: asString(data.category),
    name: asString(data.name),
    email: asString(data.email),
    phone: asString(data.phone),
    school: asString(data.school),
    roundCity: asString(data.roundCity),
    notes: asString(data.notes),
    status,
    registrationId: data.registrationId
      ? asString(data.registrationId)
      : undefined,
    paymentStatus,
    paymentGateway: data.paymentGateway
      ? asString(data.paymentGateway)
      : undefined,
    paymentId: data.paymentId ? asString(data.paymentId) : undefined,
    trxId: data.trxId ? asString(data.trxId) : undefined,
    amountPaid:
      data.amountPaid == null ? undefined : asNumber(data.amountPaid),
    paidAt: toIso(data.paidAt),
    emailSent: typeof data.emailSent === "boolean" ? data.emailSent : undefined,
    pdfUrl: data.pdfUrl ? asString(data.pdfUrl) : null,
    pdfGenerated:
      typeof data.pdfGenerated === "boolean" ? data.pdfGenerated : undefined,
    adminNotes: data.adminNotes ? asString(data.adminNotes) : undefined,
    createdAt: toIso(data.createdAt),
  };
}

export async function seedRobofestContentIfMissing(): Promise<RobofestContent> {
  const defaults = getDefaultRobofestContent();
  if (!adminDb) return defaults;

  const ref = adminDb
    .collection(ROBOFEST_CONTENT_COLLECTION)
    .doc(ROBOFEST_CONTENT_DOC_ID);
  const snap = await ref.get();
  if (snap.exists) {
    return mapRobofestContentDoc(snap.data() as Record<string, unknown>);
  }

  await ref.set({
    ...defaults,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: "system-seed",
  });

  return defaults;
}

async function fetchRobofestContentFromDb(): Promise<RobofestContent> {
  if (!adminDb) return getDefaultRobofestContent();
  return seedRobofestContentIfMissing();
}

const getCachedRobofestContent = unstable_cache(
  fetchRobofestContentFromDb,
  [ROBOFEST_CONTENT_CACHE_TAG],
  { tags: [ROBOFEST_CONTENT_CACHE_TAG] },
);

/** Public/dashboard read — cached with seed fallback. */
export async function getRobofestContent(): Promise<RobofestContent> {
  try {
    return await getCachedRobofestContent();
  } catch (error) {
    console.error("[robofest-content] Failed to load content:", error);
    return getDefaultRobofestContent();
  }
}

/** Uncached read for writes / payment validation. */
export async function getRobofestContentFresh(): Promise<RobofestContent> {
  return fetchRobofestContentFromDb();
}

export function getActiveRobofestCategories(
  content: RobofestContent,
): RobofestCategoryContent[] {
  return content.categories.filter((category) => category.active && category.slug);
}

export function getRobofestCategoryFromContent(
  content: RobofestContent,
  slug: string,
): RobofestCategoryContent | undefined {
  return getActiveRobofestCategories(content).find(
    (category) => category.slug === slug,
  );
}

export function getRobofestCategoryByName(
  content: RobofestContent,
  name: string,
): RobofestCategoryContent | undefined {
  const normalized = name.trim().toLowerCase();
  return getActiveRobofestCategories(content).find(
    (category) => category.name.trim().toLowerCase() === normalized,
  );
}

/** Resolve fee: category override if set, else global amount when isPaid. */
export function resolveRobofestFee(
  content: RobofestContent,
  categoryName: string,
): { isPaid: boolean; amount: number } {
  const category = getRobofestCategoryByName(content, categoryName);
  if (category?.amount != null && category.amount > 0) {
    return { isPaid: true, amount: category.amount };
  }
  if (content.isPaid && content.amount > 0) {
    return { isPaid: true, amount: content.amount };
  }
  return { isPaid: false, amount: 0 };
}

export function getRobofestCategoryHref(slug: string): string {
  return `/robofest/${slug}`;
}
