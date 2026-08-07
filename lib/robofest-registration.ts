/**
 * Shared Robofest registration create + confirmation email/PDF helpers.
 */

import { FieldValue } from "firebase-admin/firestore";
import type { Event } from "@/types/event";
import { adminDb } from "@/lib/firebase-admin";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { uploadPDFToStorage } from "@/lib/pdfStorage";
import { generateRegistrationId } from "@/lib/registrationId";
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  type RobofestContent,
  type RobofestRegistration,
  mapRobofestRegistrationDoc,
} from "@/lib/robofest-content";

export type RobofestRegistrationFormData = {
  category: string;
  name: string;
  email: string;
  phone: string;
  school: string;
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
    description: `${form.category} — preferred round: ${form.roundCity}`,
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

export async function createRobofestRegistrationAndSendEmail(
  content: RobofestContent,
  formData: RobofestRegistrationFormData,
  paymentMeta?: {
    paymentId: string;
    trxId: string;
    amountPaid: number;
  },
): Promise<RobofestRegistrationWriteResult> {
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
  const category = formData.category.trim();
  const roundCity = formData.roundCity.trim();
  const notes = formData.notes?.trim() ?? "";

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
    roundCity,
    notes,
    registrationId,
    status: "confirmed",
    paymentStatus: isPaid ? "paid" : "n/a",
    createdAt: FieldValue.serverTimestamp(),
  };

  if (paymentMeta) {
    registrationData.paymentGateway = "bkash";
    registrationData.paymentId = paymentMeta.paymentId;
    registrationData.trxId = paymentMeta.trxId;
    registrationData.amountPaid = paymentMeta.amountPaid;
    registrationData.paidAt = now;
  }

  await regRef.set(registrationData);

  const event = buildRobofestEventForPdfEmail(content, {
    category,
    name,
    email,
    phone,
    school,
    roundCity,
    notes,
  });

  const infoParts = [
    `Category: ${category}`,
    `Preferred round: ${roundCity}`,
  ];
  if (notes) infoParts.push(`Notes: ${notes}`);
  if (paymentMeta) {
    infoParts.push(`Amount paid: BDT ${paymentMeta.amountPaid}`);
    infoParts.push(`Trx ID: ${paymentMeta.trxId}`);
  }

  const emailResult = await sendBookingConfirmationEmail({
    to: email,
    name,
    event,
    registrationId,
    bookingId: regRef.id,
    bookingDetails: {
      school,
      phone,
      information: infoParts.join("\n"),
    },
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
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: "Database unavailable." };
  }
  if (!registration.registrationId) {
    return { success: false, error: "Registration ID missing." };
  }

  const event = buildRobofestEventForPdfEmail(content, {
    category: registration.category,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    school: registration.school,
    roundCity: registration.roundCity,
    notes: registration.notes,
  });

  const infoParts = [
    `Category: ${registration.category}`,
    `Preferred round: ${registration.roundCity}`,
  ];
  if (registration.notes) infoParts.push(`Notes: ${registration.notes}`);
  if (registration.amountPaid != null) {
    infoParts.push(`Amount paid: BDT ${registration.amountPaid}`);
  }
  if (registration.trxId) {
    infoParts.push(`Trx ID: ${registration.trxId}`);
  }

  const emailResult = await sendBookingConfirmationEmail({
    to: registration.email,
    name: registration.name,
    event,
    registrationId: registration.registrationId,
    bookingId: registration.id,
    bookingDetails: {
      school: registration.school,
      phone: registration.phone,
      information: infoParts.join("\n"),
    },
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
    await ref.update({
      emailSent: true,
      emailSentAt: new Date(),
      ...pdfUpdate,
    });
    return { success: true };
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
