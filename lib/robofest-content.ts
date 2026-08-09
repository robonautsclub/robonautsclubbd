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
import { ROBOFEST_DEFAULT_FEE_PER_MEMBER_BDT } from "@/lib/robofest-fee";

export {
  ROBOFEST_DEFAULT_FEE_PER_MEMBER_BDT,
  computeRobofestRegistrationTotal,
  resolveRobofestFee,
} from "@/lib/robofest-fee";

export const ROBOFEST_CONTENT_COLLECTION = "robofestContent";
export const ROBOFEST_CONTENT_DOC_ID = "settings";
export const ROBOFEST_CONTENT_CACHE_TAG = "robofest-content-v2";
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
  bottlesumo: "/robofest/bottlesumo.jpeg",
  buildathon: "/robofest/builathon.jpeg",
  "line-following-bot": "/robofest/linefollowing.jpeg",
  "robo-exhibition": "/robofest/roboexhibition.jpeg",
};

/** Previous default covers — treat as unset so new art wins over stale CMS values. */
const ROBOFEST_LEGACY_CATEGORY_IMAGES = new Set([
  "/robofest/robofest.jpg",
  "/roboclass.jpg",
  "/feed/robotics.jpg",
  "/olympiads/robofest.png",
]);

/** Previous How it Works titles — replace with seed copy when CMS still has them. */
const ROBOFEST_LEGACY_HOW_IT_WORKS_TITLES = new Set([
  "form a team",
  "build & program",
  "compete in bangladesh",
  "aim for the world championship",
]);

/** Fallback rules PDF paths when CMS content is missing rulesPdf. */
export const ROBOFEST_CATEGORY_RULES_PDF_FALLBACKS: Record<string, string> = {
  bottlesumo: "/robofest/BottleSumo%20Competition.pdf",
  buildathon: "/robofest/BuildAthon%20Competition.pdf",
  "line-following-bot": "/robofest/Line-Following%20Bot%20Competition.pdf",
  "robo-exhibition": "/robofest/Robo-Exhibition%20Competition.pdf",
};

export function getRobofestCategoryImage(
  category: Pick<RobofestCategoryContent, "slug" | "image">,
): string {
  const image = category.image?.trim();
  const fallback =
    ROBOFEST_CATEGORY_IMAGE_FALLBACKS[category.slug] ||
    "/olympiads/robofest.png";
  if (image && !ROBOFEST_LEGACY_CATEGORY_IMAGES.has(image)) return image;
  return fallback;
}

export function getRobofestCategoryRulesPdf(
  category: Pick<RobofestCategoryContent, "slug" | "rulesPdf">,
): string | undefined {
  if (category.rulesPdf?.trim()) return category.rulesPdf.trim();
  return ROBOFEST_CATEGORY_RULES_PDF_FALLBACKS[category.slug];
}

export type RobofestHowItWorksStep = {
  icon: string;
  title: string;
  description: string;
};

export type RobofestContactLine = {
  label: string;
  phone: string;
  note: string;
};

export type RobofestContent = {
  statusBadge: string;
  presentsLabel: string;
  headline: string;
  lead: string;
  dateLabel: string;
  timeLabel: string | null;
  venueLabel: string;
  venueDetail: string;
  hostName: string;
  officialSite: string;
  categoriesUrl: string;
  generalRulesPdf: string;
  instagramUrl: string;
  contactEmail: string;
  contactHref: string;
  contactLines: RobofestContactLine[];
  dateLines: string[];
  venueLines: string[];
  placeholders: {
    schedule: string;
    roundAccent: string;
  };
  rounds: RobofestRoundContent[];
  categories: RobofestCategoryContent[];
  howItWorks: RobofestHowItWorksStep[];
  isPaid: boolean;
  amount: number;
  /** YYYY-MM-DDTHH:mm (Asia/Dhaka) or legacy YYYY-MM-DD. Null = no deadline. */
  registrationClosingDate: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type RobofestRegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export type RobofestPaymentStatus = "unpaid" | "paid" | "n/a";

export type RobofestTeamMember = {
  name: string;
  email: string;
  phone?: string;
  school?: string;
  schoolIsCustom?: boolean;
  pendingSchoolId?: string;
  branch?: string;
  grade: string;
};

export type RobofestRegistration = {
  id: string;
  category: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  schoolIsCustom?: boolean;
  pendingSchoolId?: string;
  ageCategory?: string;
  teamSize?: number;
  teamMembers?: RobofestTeamMember[];
  campusAmbassadorId?: string;
  campusAmbassadorName?: string;
  campusAmbassadorSchool?: string;
  roundCity: string;
  notes: string;
  status: RobofestRegistrationStatus;
  /** Auto-assigned competition team number, e.g. BS#001 */
  teamNumber?: string;
  registrationId?: string;
  paymentStatus?: RobofestPaymentStatus;
  paymentGateway?: string;
  paymentId?: string;
  trxId?: string;
  amountPaid?: number;
  paidAt?: string | null;
  emailSent?: boolean;
  /** How many times confirmation email was successfully sent (batch to all members counts as 1). */
  emailSendCount?: number;
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
    presentsLabel: ROBOFEST_LOCAL.presentsLabel,
    headline: ROBOFEST_LOCAL.headline,
    lead: ROBOFEST_LOCAL.lead,
    dateLabel: ROBOFEST_LOCAL.dateLabel,
    timeLabel: ROBOFEST_LOCAL.timeLabel,
    venueLabel: ROBOFEST_LOCAL.venueLabel,
    venueDetail: ROBOFEST_LOCAL.venueDetail,
    hostName: ROBOFEST_LOCAL.hostName,
    officialSite: ROBOFEST_LOCAL.officialSite,
    categoriesUrl: ROBOFEST_LOCAL.categoriesUrl,
    generalRulesPdf: ROBOFEST_LOCAL.generalRulesPdf,
    instagramUrl: ROBOFEST_LOCAL.instagramUrl,
    contactEmail: ROBOFEST_LOCAL.contactEmail,
    contactHref: ROBOFEST_LOCAL.contactHref,
    contactLines: ROBOFEST_LOCAL.contactLines.map((line) => ({ ...line })),
    dateLines: [...ROBOFEST_LOCAL.dateLines],
    venueLines: [...ROBOFEST_LOCAL.venueLines],
    placeholders: {
      schedule: ROBOFEST_LOCAL.placeholders.schedule,
      roundAccent: ROBOFEST_LOCAL.placeholders.roundAccent,
    },
    rounds: ROBOFEST_LOCAL.rounds.map((round) => ({ ...round })),
    categories: seedCategories(),
    howItWorks: ROBOFEST_HOW_IT_WORKS.map((step) => ({ ...step })),
    isPaid: true,
    amount: 300,
    registrationClosingDate: null,
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

  const slug = asString(raw.slug, fallback?.slug ?? "");
  let name = asString(raw.name, fallback?.name ?? "");
  // Official branding is BuildAthon (capital A).
  if (slug === "buildathon" || /^buildathon$/i.test(name.trim())) {
    name = "BuildAthon";
  }

  return {
    slug,
    name,
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
    rulesPdf: raw.rulesPdf
      ? asString(raw.rulesPdf)
      : fallback?.rulesPdf ||
        ROBOFEST_CATEGORY_RULES_PDF_FALLBACKS[
          asString(raw.slug, fallback?.slug ?? "")
        ],
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

  const contactLinesRaw = Array.isArray(data.contactLines)
    ? data.contactLines
    : defaults.contactLines;
  const dateLinesRaw = Array.isArray(data.dateLines)
    ? data.dateLines.filter((line): line is string => typeof line === "string")
    : defaults.dateLines;
  const venueLinesRaw = Array.isArray(data.venueLines)
    ? data.venueLines.filter((line): line is string => typeof line === "string")
    : defaults.venueLines;

  const contactLines = contactLinesRaw
    .map((raw): RobofestContactLine | null => {
      if (!raw || typeof raw !== "object") return null;
      const line = raw as Record<string, unknown>;
      const label = asString(line.label).trim();
      const phone = asString(line.phone).trim();
      const note = asString(line.note).trim();
      if (!label && !phone) return null;
      return { label, phone, note };
    })
    .filter((line): line is RobofestContactLine => line != null);

  return {
    statusBadge: asString(data.statusBadge, defaults.statusBadge),
    presentsLabel: asString(data.presentsLabel, defaults.presentsLabel),
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
    generalRulesPdf: asString(data.generalRulesPdf, defaults.generalRulesPdf),
    instagramUrl: asString(data.instagramUrl, defaults.instagramUrl),
    contactEmail: asString(data.contactEmail, defaults.contactEmail),
    contactHref: asString(data.contactHref, defaults.contactHref),
    contactLines: contactLines.length > 0 ? contactLines : defaults.contactLines,
    dateLines: dateLinesRaw.length > 0 ? dateLinesRaw.map((l) => l.trim()).filter(Boolean) : defaults.dateLines,
    venueLines: venueLinesRaw.length > 0 ? venueLinesRaw.map((l) => l.trim()).filter(Boolean) : defaults.venueLines,
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
    howItWorks: howItWorksRaw.map((step, index) => {
      const s = step as Record<string, unknown>;
      const title = asString(s.title);
      const seed = ROBOFEST_HOW_IT_WORKS[index];
      if (
        seed &&
        ROBOFEST_LEGACY_HOW_IT_WORKS_TITLES.has(title.trim().toLowerCase())
      ) {
        return {
          icon: seed.icon,
          title: seed.title,
          description: seed.description,
        };
      }
      return {
        icon: asString(s.icon, seed?.icon ?? "group"),
        title: title || seed?.title || "",
        description: asString(s.description, seed?.description ?? ""),
      };
    }),
    isPaid: asBool(data.isPaid, defaults.isPaid),
    amount: asNumber(data.amount, defaults.amount),
    registrationClosingDate: (() => {
      if (data.registrationClosingDate == null || data.registrationClosingDate === "") {
        return null;
      }
      const raw = asString(data.registrationClosingDate).trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
        return raw.slice(0, 16);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      return null;
    })(),
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

  const teamMembers = Array.isArray(data.teamMembers)
    ? (data.teamMembers
        .map((raw): RobofestTeamMember | null => {
          if (!raw || typeof raw !== "object") return null;
          const member = raw as Record<string, unknown>;
          const name = asString(member.name).trim();
          const email = asString(member.email).trim().toLowerCase();
          const grade = asString(member.grade).trim();
          const phone = asString(member.phone).trim();
          const school = asString(member.school).trim();
          const branch = asString(member.branch).trim();
          if (!name && !email && !grade) return null;
          return {
            name,
            email,
            grade,
            ...(phone ? { phone } : {}),
            ...(school ? { school } : {}),
            ...(typeof member.schoolIsCustom === "boolean"
              ? { schoolIsCustom: member.schoolIsCustom }
              : {}),
            ...(member.pendingSchoolId
              ? { pendingSchoolId: asString(member.pendingSchoolId) }
              : {}),
            ...(branch ? { branch } : {}),
          };
        })
        .filter((member): member is RobofestTeamMember => member != null) as RobofestTeamMember[])
    : undefined;

  const teamSizeRaw =
    typeof data.teamSize === "number"
      ? data.teamSize
      : teamMembers?.length || undefined;

  return {
    id,
    category: asString(data.category),
    name: asString(data.name),
    email: asString(data.email),
    phone: asString(data.phone),
    school: asString(data.school),
    schoolIsCustom:
      typeof data.schoolIsCustom === "boolean" ? data.schoolIsCustom : undefined,
    pendingSchoolId: data.pendingSchoolId
      ? asString(data.pendingSchoolId)
      : undefined,
    ageCategory: data.ageCategory ? asString(data.ageCategory) : undefined,
    teamSize:
      typeof teamSizeRaw === "number" && teamSizeRaw > 0
        ? teamSizeRaw
        : undefined,
    teamMembers,
    campusAmbassadorId: data.campusAmbassadorId
      ? asString(data.campusAmbassadorId)
      : undefined,
    campusAmbassadorName: data.campusAmbassadorName
      ? asString(data.campusAmbassadorName)
      : undefined,
    campusAmbassadorSchool: data.campusAmbassadorSchool
      ? asString(data.campusAmbassadorSchool)
      : undefined,
    roundCity: asString(data.roundCity),
    notes: asString(data.notes),
    status,
    teamNumber: data.teamNumber ? asString(data.teamNumber) : undefined,
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
    emailSendCount: (() => {
      const raw = data.emailSendCount;
      if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
        return Math.floor(raw);
      }
      // Legacy docs: treat a successful send as count 1
      if (data.emailSent === true) return 1;
      return undefined;
    })(),
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
    const content = await getCachedRobofestContent();
    // Re-normalize so older cached shapes pick up new fields.
    return mapRobofestContentDoc(content as unknown as Record<string, unknown>);
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

/** Look up a local-round entry by division/city name (case-insensitive). */
export function getRobofestRoundForCity(
  content: RobofestContent,
  city: string,
): RobofestRoundContent | undefined {
  const normalized = city.trim().toLowerCase();
  if (!normalized) return undefined;
  return (content.rounds || []).find(
    (round) => round.city.trim().toLowerCase() === normalized,
  );
}

function cityDateNeedle(city: string): string | null {
  const normalized = city.trim().toLowerCase();
  if (normalized.startsWith("chit") || normalized.includes("ctg")) return "CTG";
  if (normalized.startsWith("dha") || normalized.includes("dhk")) return "DHK";
  return null;
}

/** Division date for PDF/email/verify — prefers CTG/DHK labels from content. */
export function resolveRobofestRoundDateLabel(
  content: RobofestContent,
  city: string,
): string {
  const round = getRobofestRoundForCity(content, city);
  const fromRound = round?.dates?.trim() || "";
  if (/\((CTG|DHK)\)/i.test(fromRound)) return fromRound;

  const needle = cityDateNeedle(city);
  if (needle && content.dateLines?.length) {
    const fromLines = content.dateLines.find((line) =>
      line.toUpperCase().includes(needle),
    );
    if (fromLines?.trim()) return fromLines.trim();
  }

  if (fromRound) return fromRound;
  return content.dateLabel || "TBA";
}

/** Division venue for PDF/email/verify. */
export function resolveRobofestRoundVenueLabel(
  content: RobofestContent,
  city: string,
): string {
  const round = getRobofestRoundForCity(content, city);
  const fromRound = round?.venueLabel?.trim() || "";
  if (fromRound && !fromRound.includes("·")) return fromRound;

  const cityLower = city.trim().toLowerCase();
  if (cityLower && content.venueLines?.length) {
    const fromLines = content.venueLines.find((line) =>
      line.toLowerCase().includes(cityLower),
    );
    if (fromLines?.trim()) return fromLines.trim();
  }

  if (fromRound) return fromRound;
  return content.venueLabel || "TBA";
}

export function getRobofestCategoryHref(slug: string): string {
  return `/robofest/${slug}`;
}
