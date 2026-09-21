/**
 * Shared Robofest registration create + confirmation email/PDF helpers.
 */

import type { Event } from "@/types/event";
import {
  collectionAdd,
  collectionGet,
  collectionSet,
  collectionWhere,
} from "@/lib/db/collections";
import { generateRegistrationId } from "@/lib/registrationId";
import { allocateRobofestTeamNumber } from "@/lib/robofest-team-number";
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  resolveRobofestRoundDateLabel,
  resolveRobofestRoundVenueLabel,
  type RobofestContent,
  type RobofestRegistration,
  type RobofestTeamMember,
  mapRobofestRegistrationDoc,
} from "@/lib/robofest-content";
import {
  formatAgeCategoryLabel,
  type RobofestAgeCategory,
} from "@/lib/robofest-registration-options";
import { resolvePublicBaseUrl } from "@/lib/site-config";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uniqueMemberEmails(
  teamMembers: RobofestTeamMember[] | undefined,
  fallbackEmail?: string,
): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const member of teamMembers || []) {
    const email = (member.email || "").trim().toLowerCase();
    if (!email || !emailRegex.test(email) || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  if (emails.length === 0 && fallbackEmail) {
    const fallback = fallbackEmail.trim().toLowerCase();
    if (fallback && emailRegex.test(fallback)) emails.push(fallback);
  }
  return emails;
}

export type RobofestRegistrationFormData = {
  category: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  schoolIsCustom?: boolean;
  pendingSchoolId?: string;
  ageCategory: RobofestAgeCategory;
  teamSize: number;
  teamMembers: RobofestTeamMember[];
  campusAmbassadorId?: string;
  campusAmbassadorName?: string;
  campusAmbassadorSchool?: string;
  roundCity: string;
  notes?: string;
};

export type RobofestRegistrationWriteResult = {
  success: boolean;
  error?: string;
  warning?: string;
  registrationDocId?: string;
  registrationId?: string;
  teamNumber?: string;
  /** True when at least one confirmation email was accepted by Brevo. */
  emailSent?: boolean;
};

function formatMemberLine(member: RobofestTeamMember): string {
  const parts = [
    member.name,
    member.email ? `<${member.email}>` : "",
    member.phone || "",
    member.school || "",
    member.branch ? `Branch: ${member.branch}` : "",
    member.grade || "",
  ].filter(Boolean);
  return parts.join(" · ");
}

function buildRegistrationInfoParts(
  data: Pick<
    RobofestRegistrationFormData,
    | "category"
    | "roundCity"
    | "ageCategory"
    | "teamSize"
    | "teamMembers"
    | "campusAmbassadorName"
    | "campusAmbassadorSchool"
    | "notes"
  > & {
    amountPaid?: number;
    trxId?: string;
    includeMembers?: boolean;
  },
): string[] {
  const includeMembers = data.includeMembers !== false;
  const infoParts = [
    `Competition: ${data.category}`,
    `Division: ${data.roundCity}`,
    `Age category: ${formatAgeCategoryLabel(data.ageCategory)}`,
    `Team size: ${data.teamSize}`,
  ];
  if (includeMembers && data.teamMembers.length > 0) {
    infoParts.push(
      `Members: ${data.teamMembers.map((m) => formatMemberLine(m)).join("; ")}`,
    );
  }
  if (data.campusAmbassadorName) {
    infoParts.push(
      `Campus ambassador: ${data.campusAmbassadorName}${
        data.campusAmbassadorSchool ? ` · ${data.campusAmbassadorSchool}` : ""
      }`,
    );
  }
  if (data.notes) infoParts.push(`Notes: ${data.notes}`);
  if (data.amountPaid != null) {
    infoParts.push(`Amount paid: BDT ${data.amountPaid}`);
  }
  if (data.trxId) infoParts.push(`Trx ID: ${data.trxId}`);
  return infoParts;
}

function getBaseUrl(): string {
  return resolvePublicBaseUrl();
}

export function buildRobofestEventForPdfEmail(
  content: RobofestContent,
  form: RobofestRegistrationFormData,
): Event {
  const now = new Date().toISOString();
  const date = resolveRobofestRoundDateLabel(content, form.roundCity);
  const venueLabel = resolveRobofestRoundVenueLabel(content, form.roundCity);

  return {
    id: "robofest",
    title: content.headline || "Robofest Local Round · Bangladesh",
    date,
    time: content.timeLabel ?? undefined,
    location: venueLabel,
    venue: venueLabel,
    description: `${form.category} — ${formatAgeCategoryLabel(form.ageCategory)} · ${form.roundCity} Division`,
    fullDescription: content.lead,
    eligibility: "⁠RoboFest Bangladesh Round Participants",
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  };
}

/**
 * Build a confirmation PDF from in-memory registration + content (no Firestore reads).
 */
export async function generateRobofestConfirmationPdfFromData(
  registration: RobofestRegistration,
  content: RobofestContent,
  baseUrl?: string,
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  if (!registration.registrationId) {
    return { error: "Registration ID is missing." };
  }

  const ageCategory =
    registration.ageCategory === "innovators" ? "innovators" : "explorer";
  const teamMembers = registration.teamMembers || [];
  const teamSize = registration.teamSize || teamMembers.length || 1;

  const event = buildRobofestEventForPdfEmail(content, {
    category: registration.category,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    school: registration.school,
    ageCategory,
    teamSize,
    teamMembers,
    campusAmbassadorId: registration.campusAmbassadorId,
    campusAmbassadorName: registration.campusAmbassadorName,
    campusAmbassadorSchool: registration.campusAmbassadorSchool,
    roundCity: registration.roundCity,
    notes: registration.notes,
  });

  const infoParts = buildRegistrationInfoParts({
    category: registration.category,
    roundCity: registration.roundCity,
    ageCategory,
    teamSize,
    teamMembers,
    campusAmbassadorName: registration.campusAmbassadorName,
    campusAmbassadorSchool: registration.campusAmbassadorSchool,
    notes: registration.notes,
    amountPaid: registration.amountPaid,
    trxId: registration.trxId,
    includeMembers: false,
  });

  const origin = (baseUrl || getBaseUrl()).replace(/\/$/, "");
  const verificationUrl = `${origin}/verify-booking?registrationId=${encodeURIComponent(registration.registrationId)}`;

  const { generateBookingConfirmationPDF } = await import("@/lib/pdfGenerator");
  const buffer = await generateBookingConfirmationPDF({
    registrationId: registration.registrationId,
    bookingId: registration.id,
    event,
    bookingDetails: {
      name: registration.name,
      teamName: registration.name,
      teamNumber: registration.teamNumber,
      email: registration.email,
      school: registration.school,
      phone: registration.phone,
      information: infoParts.join("\n"),
      teamMembers,
    },
    verificationUrl,
  });

  return {
    buffer,
    filename: `Robofest-Confirmation-${registration.registrationId}.pdf`,
  };
}

export async function hasExistingRobofestRegistration(
  category: string,
  normalizedEmail: string,
  excludeId?: string,
): Promise<boolean> {
  const matches = await collectionWhere(
    ROBOFEST_REGISTRATIONS_COLLECTION,
    "email",
    "==",
    normalizedEmail,
  );
  const exclude = excludeId?.trim() || "";
  return matches.some((doc) => {
    if (String(doc.category ?? "") !== category) return false;
    if (exclude && doc.id === exclude) return false;
    const status = String(doc.status ?? "pending");
    return status !== "cancelled";
  });
}

export type RobofestPaymentMeta = {
  paymentId: string;
  trxId?: string;
  amountPaid: number;
  paymentGateway?: string;
};

export type RobofestCreateOptions = {
  /** Default true. When false, skip email and PDF generation. */
  sendEmail?: boolean;
  paymentMeta?: RobofestPaymentMeta;
};

export async function createRobofestRegistrationAndSendEmail(
  content: RobofestContent,
  formData: RobofestRegistrationFormData,
  options: RobofestCreateOptions = {},
): Promise<RobofestRegistrationWriteResult> {
  const sendEmail = options.sendEmail !== false;
  const paymentMeta = options.paymentMeta;

  const email = formData.email.trim().toLowerCase();
  const phone = formData.phone.trim().replace(/\s/g, "");
  const school = formData.school.trim();
  const schoolIsCustom = Boolean(formData.schoolIsCustom);
  const pendingSchoolId = formData.pendingSchoolId?.trim() || undefined;
  const category = formData.category.trim();
  const roundCity = formData.roundCity.trim();
  const notes = formData.notes?.trim() ?? "";
  const teamMembers = (formData.teamMembers || []).map((member) => ({
    name: member.name.trim(),
    email: member.email.trim().toLowerCase(),
    phone: member.phone?.trim().replace(/\s/g, "") || undefined,
    school: member.school?.trim() || undefined,
    schoolIsCustom: Boolean(member.schoolIsCustom),
    pendingSchoolId: member.pendingSchoolId?.trim() || undefined,
    branch: member.branch?.trim() || undefined,
    grade: member.grade.trim(),
  }));
  const teamSize =
    typeof formData.teamSize === "number" && formData.teamSize > 0
      ? formData.teamSize
      : teamMembers.length;
  const ageCategory = formData.ageCategory;

  const duplicate = await hasExistingRobofestRegistration(category, email);
  if (duplicate) {
    return {
      success: false,
      error: "You have already registered for this category with this email.",
    };
  }

  const registrationId = generateRegistrationId();
  const teamNumber = await allocateRobofestTeamNumber(category);
  if (!teamNumber) {
    return {
      success: false,
      error:
        "Could not assign a team number for this competition. Please try again or contact support.",
    };
  }
  // Team name is the auto-assigned team number (students cannot choose a name).
  const name = teamNumber;
  const nowIso = new Date().toISOString();
  const now = new Date();
  const isPaid = Boolean(paymentMeta);

  const registrationData: Record<string, unknown> = {
    category,
    name,
    teamNumber,
    email,
    phone,
    school,
    schoolIsCustom,
    ageCategory,
    teamSize,
    teamMembers,
    roundCity,
    notes,
    registrationId,
    status: "confirmed",
    paymentStatus: isPaid ? "paid" : "n/a",
    createdAt: nowIso,
  };

  if (pendingSchoolId) {
    registrationData.pendingSchoolId = pendingSchoolId;
  }
  if (formData.campusAmbassadorId) {
    registrationData.campusAmbassadorId = formData.campusAmbassadorId;
    registrationData.campusAmbassadorName = formData.campusAmbassadorName || "";
    registrationData.campusAmbassadorSchool =
      formData.campusAmbassadorSchool || "";
  }

  if (paymentMeta) {
    registrationData.paymentGateway = paymentMeta.paymentGateway || "bkash";
    registrationData.paymentId = paymentMeta.paymentId;
    if (paymentMeta.trxId) {
      registrationData.trxId = paymentMeta.trxId;
    }
    registrationData.amountPaid = paymentMeta.amountPaid;
    registrationData.paidAt = now;
  }

  const registrationDocId = await collectionAdd(
    ROBOFEST_REGISTRATIONS_COLLECTION,
    registrationData,
  );

  if (!sendEmail) {
    return {
      success: true,
      registrationDocId,
      registrationId,
      teamNumber,
      emailSent: false,
    };
  }

  const event = buildRobofestEventForPdfEmail(content, {
    category,
    name,
    email,
    phone,
    school,
    ageCategory,
    teamSize,
    teamMembers,
    campusAmbassadorId: formData.campusAmbassadorId,
    campusAmbassadorName: formData.campusAmbassadorName,
    campusAmbassadorSchool: formData.campusAmbassadorSchool,
    roundCity,
    notes,
  });

  const infoParts = buildRegistrationInfoParts({
    category,
    roundCity,
    ageCategory,
    teamSize,
    teamMembers,
    campusAmbassadorName: formData.campusAmbassadorName,
    campusAmbassadorSchool: formData.campusAmbassadorSchool,
    notes,
    amountPaid: paymentMeta?.amountPaid,
    trxId: paymentMeta?.trxId,
    includeMembers: false,
  });

  const recipients = uniqueMemberEmails(teamMembers, email);
  const { sendRobofestConfirmationEmail } = await import("@/lib/robofest-email");
  const emailResult = await sendRobofestConfirmationEmail({
    recipients,
    teamName: name,
    teamNumber,
    competition: category,
    division: roundCity,
    ageCategory,
    teamMembers,
    event,
    registrationId,
    bookingId: registrationDocId,
    school,
    phone,
    information: infoParts.join("\n"),
    amountPaid: paymentMeta?.amountPaid,
    trxId: paymentMeta?.trxId,
  });

  const partialFailure =
    emailResult.success &&
    Array.isArray(emailResult.failedRecipients) &&
    emailResult.failedRecipients.length > 0;

  try {
    const pdfUpdate: Record<string, unknown> = {};
    if (emailResult.pdfBuffer && emailResult.pdfBuffer.length > 0) {
      pdfUpdate.pdfGenerated = true;
      pdfUpdate.pdfGeneratedAt = new Date();
    } else {
      pdfUpdate.pdfGenerated = false;
      if (emailResult.pdfError) {
        pdfUpdate.pdfError = emailResult.pdfError;
      }
    }

    if (emailResult.success) {
      await collectionSet(
        ROBOFEST_REGISTRATIONS_COLLECTION,
        registrationDocId,
        {
          emailSent: true,
          emailSentAt: nowIso,
          emailSendCount: 1,
          emailRecipientCount: recipients.length,
          emailPartialFailure: partialFailure,
          emailError: partialFailure
            ? emailResult.warning ||
              `Partial send failure: ${emailResult.failedRecipients?.join(", ")}`
            : null,
          ...pdfUpdate,
        },
        { merge: true },
      );
    } else {
      await collectionSet(
        ROBOFEST_REGISTRATIONS_COLLECTION,
        registrationDocId,
        {
          emailSent: false,
          emailPartialFailure: false,
          emailError: emailResult.error || "Unknown email service error",
          emailFailedAt: nowIso,
          emailRecipientCount: recipients.length,
          ...pdfUpdate,
        },
        { merge: true },
      );
    }
  } catch (updateError) {
    console.error(
      `[robofest] Failed to update email/PDF status for ${registrationDocId}:`,
      updateError,
    );
  }

  if (!emailResult.success) {
    return {
      success: true,
      registrationDocId,
      registrationId,
      teamNumber,
      emailSent: false,
      warning: `Your registration was saved (ID: ${registrationId}), but we couldn't send the confirmation email. Please contact support.`,
    };
  }

  if (partialFailure) {
    return {
      success: true,
      registrationDocId,
      registrationId,
      teamNumber,
      emailSent: true,
      warning:
        emailResult.warning ||
        `Your registration was confirmed (ID: ${registrationId}), but some confirmation emails failed to send.`,
    };
  }

  if (!emailResult.pdfAttached) {
    return {
      success: true,
      registrationDocId,
      registrationId,
      teamNumber,
      emailSent: true,
      warning: `Your registration was confirmed (ID: ${registrationId}), but we couldn't attach the confirmation PDF.`,
    };
  }

  return {
    success: true,
    registrationDocId,
    registrationId,
    teamNumber,
    emailSent: true,
  };
}

export async function resendRobofestConfirmationEmail(
  registration: RobofestRegistration,
  content: RobofestContent,
): Promise<{
  success: boolean;
  error?: string;
  warning?: string;
  recipientCount?: number;
  emailSendCount?: number;
}> {
  if (!registration.registrationId) {
    return { success: false, error: "Registration ID missing." };
  }

  const ageCategory =
    registration.ageCategory === "innovators" ? "innovators" : "explorer";

  const event = buildRobofestEventForPdfEmail(content, {
    category: registration.category,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    school: registration.school,
    ageCategory,
    teamSize: registration.teamSize || registration.teamMembers?.length || 1,
    teamMembers: registration.teamMembers || [],
    campusAmbassadorId: registration.campusAmbassadorId,
    campusAmbassadorName: registration.campusAmbassadorName,
    campusAmbassadorSchool: registration.campusAmbassadorSchool,
    roundCity: registration.roundCity,
    notes: registration.notes,
  });

  const infoParts = buildRegistrationInfoParts({
    category: registration.category,
    roundCity: registration.roundCity,
    ageCategory,
    teamSize: registration.teamSize || registration.teamMembers?.length || 1,
    teamMembers: registration.teamMembers || [],
    campusAmbassadorName: registration.campusAmbassadorName,
    campusAmbassadorSchool: registration.campusAmbassadorSchool,
    notes: registration.notes,
    amountPaid: registration.amountPaid,
    trxId: registration.trxId,
    includeMembers: false,
  });

  const teamMembers = registration.teamMembers || [];
  const recipients = uniqueMemberEmails(teamMembers, registration.email);
  const { sendRobofestConfirmationEmail } = await import("@/lib/robofest-email");
  const emailResult = await sendRobofestConfirmationEmail({
    recipients,
    teamName: registration.name,
    teamNumber: registration.teamNumber,
    competition: registration.category,
    division: registration.roundCity,
    ageCategory,
    teamMembers,
    event,
    registrationId: registration.registrationId,
    bookingId: registration.id,
    school: registration.school,
    phone: registration.phone,
    information: infoParts.join("\n"),
    amountPaid: registration.amountPaid,
    trxId: registration.trxId,
  });

  const pdfUpdate: Record<string, unknown> = {};
  if (emailResult.pdfBuffer && emailResult.pdfBuffer.length > 0) {
    pdfUpdate.pdfGenerated = true;
    pdfUpdate.pdfGeneratedAt = new Date();
  } else {
    pdfUpdate.pdfGenerated = false;
    if (emailResult.pdfError) {
      pdfUpdate.pdfError = emailResult.pdfError;
    }
  }

  if (emailResult.success) {
    const nextCount = (registration.emailSendCount ?? 0) + 1;
    const partialFailure =
      Array.isArray(emailResult.failedRecipients) &&
      emailResult.failedRecipients.length > 0;
    await collectionSet(
      ROBOFEST_REGISTRATIONS_COLLECTION,
      registration.id,
      {
        emailSent: true,
        emailSentAt: new Date().toISOString(),
        emailSendCount: nextCount,
        emailRecipientCount: recipients.length,
        emailPartialFailure: partialFailure,
        emailError: partialFailure
          ? emailResult.warning ||
            `Partial send failure: ${emailResult.failedRecipients?.join(", ")}`
          : null,
        ...pdfUpdate,
      },
      { merge: true },
    );
    return {
      success: true,
      recipientCount: recipients.length,
      emailSendCount: nextCount,
      warning: emailResult.warning,
    };
  }

  await collectionSet(
    ROBOFEST_REGISTRATIONS_COLLECTION,
    registration.id,
    {
      emailSent: false,
      emailPartialFailure: false,
      emailError: emailResult.error || "Unknown email service error",
      emailFailedAt: new Date().toISOString(),
      ...pdfUpdate,
    },
    { merge: true },
  );

  return {
    success: false,
    error: emailResult.error || "Failed to resend confirmation email.",
  };
}

export async function getRobofestRegistrationById(
  id: string,
): Promise<RobofestRegistration | null> {
  const doc = await collectionGet(ROBOFEST_REGISTRATIONS_COLLECTION, id);
  if (!doc) return null;
  return mapRobofestRegistrationDoc(
    String(doc.id),
    doc as Record<string, unknown>,
  );
}

export async function getRobofestRegistrationByRegistrationId(
  registrationId: string,
): Promise<RobofestRegistration | null> {
  if (!registrationId.trim()) return null;
  const matches = await collectionWhere(
    ROBOFEST_REGISTRATIONS_COLLECTION,
    "registrationId",
    "==",
    registrationId.trim(),
    { limit: 1 },
  );
  if (matches.length === 0) return null;
  const doc = matches[0];
  return mapRobofestRegistrationDoc(
    String(doc.id),
    doc as Record<string, unknown>,
  );
}

export { getBaseUrl as getRobofestBaseUrl };
