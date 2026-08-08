/**
 * Shared Robofest registration create + confirmation email/PDF helpers.
 */

import { FieldValue } from "firebase-admin/firestore";
import type { Event } from "@/types/event";
import { adminDb } from "@/lib/firebase-admin";
import {
  sendRobofestConfirmationEmail,
  uniqueMemberEmails,
} from "@/lib/robofest-email";
import { uploadPDFToStorage } from "@/lib/pdfStorage";
import { generateRegistrationId } from "@/lib/registrationId";
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  type RobofestContent,
  type RobofestRegistration,
  type RobofestTeamMember,
  mapRobofestRegistrationDoc,
} from "@/lib/robofest-content";
import {
  formatAgeCategoryLabel,
  type RobofestAgeCategory,
} from "@/lib/robofest-registration-options";

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
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:3000";
    } else {
      baseUrl = "https://robonautsclub.com";
    }
  }
  return baseUrl.replace(/\/$/, "");
}

export function buildRobofestEventForPdfEmail(
  content: RobofestContent,
  form: RobofestRegistrationFormData,
): Event {
  const now = new Date().toISOString();
  return {
    id: "robofest",
    title: content.headline || "Robofest Local Round · Bangladesh",
    date: content.dateLabel,
    time: content.timeLabel ?? undefined,
    location: content.venueLabel,
    venue: `${form.roundCity} · ${content.venueLabel}`,
    description: `${form.category} — ${formatAgeCategoryLabel(form.ageCategory)} · ${form.roundCity} Division`,
    fullDescription: content.lead,
    eligibility: "Robofest Bangladesh local round participants",
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  };
}

export async function hasExistingRobofestRegistration(
  category: string,
  normalizedEmail: string,
): Promise<boolean> {
  if (!adminDb) return false;
  const snap = await adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .where("email", "==", normalizedEmail)
    .where("category", "==", category)
    .limit(5)
    .get();

  return snap.docs.some((doc) => {
    const status = String(doc.data().status ?? "pending");
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

  if (!adminDb) {
    return {
      success: false,
      error: "Service temporarily unavailable. Please try again later.",
    };
  }

  const name = formData.name.trim();
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
  const regRef = adminDb.collection(ROBOFEST_REGISTRATIONS_COLLECTION).doc();
  const now = new Date();
  const isPaid = Boolean(paymentMeta);

  const registrationData: Record<string, unknown> = {
    category,
    name,
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
    createdAt: FieldValue.serverTimestamp(),
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

  await regRef.set(registrationData);

  if (!sendEmail) {
    return {
      success: true,
      registrationDocId: regRef.id,
      registrationId,
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
  const emailResult = await sendRobofestConfirmationEmail({
    recipients,
    teamName: name,
    competition: category,
    division: roundCity,
    ageCategory,
    teamMembers,
    event,
    registrationId,
    bookingId: regRef.id,
    school,
    phone,
    information: infoParts.join("\n"),
    amountPaid: paymentMeta?.amountPaid,
    trxId: paymentMeta?.trxId,
  });

  try {
    const pdfUpdate: Record<string, unknown> = {};
    if (emailResult.pdfBuffer && emailResult.pdfBuffer.length > 0) {
      const uploadedPdfUrl = await uploadPDFToStorage(
        emailResult.pdfBuffer,
        "robofest",
        regRef.id,
      );
      if (uploadedPdfUrl) {
        pdfUpdate.pdfUrl = uploadedPdfUrl;
      }
      pdfUpdate.pdfGenerated = true;
      pdfUpdate.pdfGeneratedAt = new Date();
    } else {
      pdfUpdate.pdfGenerated = false;
      if (emailResult.pdfError) {
        pdfUpdate.pdfError = emailResult.pdfError;
      }
    }

    if (emailResult.success) {
      await regRef.update({
        emailSent: true,
        emailSentAt: new Date(),
        emailSendCount: 1,
        emailRecipientCount: recipients.length,
        emailError: FieldValue.delete(),
        ...pdfUpdate,
      });
    } else {
      await regRef.update({
        emailSent: false,
        emailError: emailResult.error || "Unknown email service error",
        emailFailedAt: new Date(),
        ...pdfUpdate,
      });
    }
  } catch (updateError) {
    console.error(
      `[robofest] Failed to update email/PDF status for ${regRef.id}:`,
      updateError,
    );
  }

  if (!emailResult.success) {
    return {
      success: true,
      registrationDocId: regRef.id,
      registrationId,
      warning: `Your registration was saved (ID: ${registrationId}), but we couldn't send the confirmation email. Please contact support.`,
    };
  }

  if (!emailResult.pdfAttached) {
    return {
      success: true,
      registrationDocId: regRef.id,
      registrationId,
      warning: `Your registration was confirmed (ID: ${registrationId}), but we couldn't attach the confirmation PDF.`,
    };
  }

  return {
    success: true,
    registrationDocId: regRef.id,
    registrationId,
  };
}

export async function resendRobofestConfirmationEmail(
  registration: RobofestRegistration,
  content: RobofestContent,
): Promise<{
  success: boolean;
  error?: string;
  recipientCount?: number;
  emailSendCount?: number;
}> {
  if (!adminDb) {
    return { success: false, error: "Database unavailable." };
  }
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
  const emailResult = await sendRobofestConfirmationEmail({
    recipients,
    teamName: registration.name,
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

  const ref = adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .doc(registration.id);

  const pdfUpdate: Record<string, unknown> = {};
  if (emailResult.pdfBuffer && emailResult.pdfBuffer.length > 0) {
    const uploadedPdfUrl = await uploadPDFToStorage(
      emailResult.pdfBuffer,
      "robofest",
      registration.id,
    );
    if (uploadedPdfUrl) pdfUpdate.pdfUrl = uploadedPdfUrl;
    pdfUpdate.pdfGenerated = true;
    pdfUpdate.pdfGeneratedAt = new Date();
  }

  if (emailResult.success) {
    const nextCount = (registration.emailSendCount ?? 0) + 1;
    await ref.update({
      emailSent: true,
      emailSentAt: new Date(),
      emailSendCount: nextCount,
      emailRecipientCount: recipients.length,
      emailError: FieldValue.delete(),
      ...pdfUpdate,
    });
    return {
      success: true,
      recipientCount: recipients.length,
      emailSendCount: nextCount,
    };
  }

  await ref.update({
    emailSent: false,
    emailError: emailResult.error || "Unknown email service error",
    emailFailedAt: new Date(),
    ...pdfUpdate,
  });

  return {
    success: false,
    error: emailResult.error || "Failed to resend confirmation email.",
  };
}

export async function getRobofestRegistrationById(
  id: string,
): Promise<RobofestRegistration | null> {
  if (!adminDb) return null;
  const snap = await adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .doc(id)
    .get();
  if (!snap.exists) return null;
  return mapRobofestRegistrationDoc(
    snap.id,
    snap.data() as Record<string, unknown>,
  );
}

export async function getRobofestRegistrationByRegistrationId(
  registrationId: string,
): Promise<RobofestRegistration | null> {
  if (!adminDb || !registrationId.trim()) return null;
  const snap = await adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .where("registrationId", "==", registrationId.trim())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapRobofestRegistrationDoc(
    doc.id,
    doc.data() as Record<string, unknown>,
  );
}

export { getBaseUrl as getRobofestBaseUrl };
