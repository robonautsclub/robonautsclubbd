"use server";

import {
  BkashApiError,
  bkashCreateCheckout,
  bkashExecutePayment,
  bkashQueryPayment,
} from "@/lib/bkash";
import { adminDb } from "@/lib/firebase-admin";
import {
  createPendingSchoolIfNeeded,
  resolveSchoolFromSelection,
} from "@/lib/pendingSchool";
import {
  getRobofestCategoryByName,
  getRobofestContentFresh,
  resolveRobofestFee,
} from "@/lib/robofest-content";
import {
  createRobofestRegistrationAndSendEmail,
  getRobofestBaseUrl,
  hasExistingRobofestRegistration,
  type RobofestRegistrationFormData,
} from "@/lib/robofest-registration";

export type RobofestRegistrationInput = {
  category: string;
  name: string;
  email: string;
  phone: string;
  schoolSelection: string;
  customSchool?: string;
  teamSize: number;
  teamMembers: Array<{ name: string; email: string; grade: string }>;
  roundCity: string;
  notes?: string;
};

export type RobofestRegistrationResult = {
  success: boolean;
  error?: string;
  warning?: string;
  registrationId?: string;
  registrationDocId?: string;
  checkoutUrl?: string;
};

type PendingRobofestRegistration = {
  kind: "robofest";
  paymentId: string;
  category: string;
  name: string;
  school: string;
  schoolIsCustom: boolean;
  pendingSchoolId?: string;
  email: string;
  phone: string;
  teamSize: number;
  teamMembers: Array<{ name: string; email: string; grade: string }>;
  roundCity: string;
  notes: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  registrationDocId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseTeamMembers(
  rawMembers: RobofestRegistrationInput["teamMembers"] | undefined,
  teamSizeRaw: number | undefined,
):
  | { ok: true; teamSize: number; teamMembers: Array<{ name: string; email: string; grade: string }> }
  | { ok: false; error: string } {
  const teamSize = Math.min(4, Math.max(1, Number(teamSizeRaw) || 0));
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 4) {
    return { ok: false, error: "Team size must be between 1 and 4." };
  }

  const list = Array.isArray(rawMembers) ? rawMembers.slice(0, teamSize) : [];
  if (list.length !== teamSize) {
    return {
      ok: false,
      error: `Please provide details for all ${teamSize} team member(s).`,
    };
  }

  const teamMembers: Array<{ name: string; email: string; grade: string }> = [];
  for (let i = 0; i < list.length; i += 1) {
    const name = list[i]?.name?.trim() ?? "";
    const email = list[i]?.email?.trim().toLowerCase() ?? "";
    const grade = list[i]?.grade?.trim() ?? "";
    if (!name || !email || !grade) {
      return {
        ok: false,
        error: `Team member ${i + 1} requires name, email, and grade.`,
      };
    }
    if (!EMAIL_REGEX.test(email)) {
      return {
        ok: false,
        error: `Team member ${i + 1} has an invalid email.`,
      };
    }
    teamMembers.push({ name, email, grade });
  }

  return { ok: true, teamSize, teamMembers };
}

async function validateAndResolveSchool(formData: RobofestRegistrationInput): Promise<
  | {
      ok: true;
      data: RobofestRegistrationFormData;
    }
  | { ok: false; error: string }
> {
  const category = formData.category?.trim() ?? "";
  const name = formData.name?.trim() ?? "";
  const email = formData.email?.trim().toLowerCase() ?? "";
  const phone = formData.phone?.trim().replace(/\s/g, "") ?? "";
  const schoolSelection = formData.schoolSelection?.trim() ?? "";
  const customSchool = formData.customSchool?.trim() ?? "";
  const roundCity = formData.roundCity?.trim() ?? "";
  const notes = formData.notes?.trim() ?? "";

  if (!category || !name || !email || !phone || !schoolSelection || !roundCity) {
    return { ok: false, error: "All required fields must be filled." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Invalid email format." };
  }

  if (phone.length !== 11 || !phone.startsWith("01")) {
    return {
      ok: false,
      error: "Phone number must be 11 digits and start with 01.",
    };
  }

  const membersParsed = parseTeamMembers(formData.teamMembers, formData.teamSize);
  if (!membersParsed.ok) return { ok: false, error: membersParsed.error };

  const resolved = resolveSchoolFromSelection(schoolSelection, customSchool);
  if (!resolved.school) {
    return { ok: false, error: "Please select or enter your school." };
  }

  let school = resolved.school;
  let schoolIsCustom = resolved.isCustom;
  let pendingSchoolId: string | undefined;

  if (resolved.isCustom) {
    const pending = await createPendingSchoolIfNeeded(resolved.school, {
      requestedByName: name,
      requestedByEmail: email,
      source: "robofest",
    });
    school = pending.school;
    schoolIsCustom = pending.schoolIsCustom;
    pendingSchoolId = pending.pendingSchoolId;
  }

  return {
    ok: true,
    data: {
      category,
      name,
      email,
      phone,
      school,
      schoolIsCustom,
      pendingSchoolId,
      teamSize: membersParsed.teamSize,
      teamMembers: membersParsed.teamMembers,
      roundCity,
      notes,
    },
  };
}

/** Free registration (or when fee is 0). */
export async function submitRobofestRegistration(
  formData: RobofestRegistrationInput,
): Promise<RobofestRegistrationResult> {
  try {
    if (!adminDb) {
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again later.",
      };
    }

    const validated = await validateAndResolveSchool(formData);
    if (!validated.ok) return { success: false, error: validated.error };

    const content = await getRobofestContentFresh();
    const category = getRobofestCategoryByName(content, validated.data.category);
    if (!category) {
      return { success: false, error: "Selected category is not valid." };
    }

    const roundOk = content.rounds.some(
      (round) => round.city === validated.data.roundCity,
    );
    if (!roundOk) {
      return { success: false, error: "Please select a valid round city." };
    }

    const fee = resolveRobofestFee(content, category.name);
    if (fee.isPaid) {
      return {
        success: false,
        error: "This category requires payment. Please use the payment flow.",
      };
    }

    return await createRobofestRegistrationAndSendEmail(content, {
      ...validated.data,
      category: category.name,
    });
  } catch (error) {
    console.error("Error submitting Robofest registration:", error);
    return {
      success: false,
      error: "Failed to submit registration. Please try again.",
    };
  }
}

export async function initiateRobofestPaidCheckout(
  formData: RobofestRegistrationInput,
): Promise<RobofestRegistrationResult> {
  try {
    if (!adminDb) {
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again later.",
      };
    }

    const validated = await validateAndResolveSchool(formData);
    if (!validated.ok) return { success: false, error: validated.error };

    const content = await getRobofestContentFresh();
    const category = getRobofestCategoryByName(content, validated.data.category);
    if (!category) {
      return { success: false, error: "Selected category is not valid." };
    }

    const roundOk = content.rounds.some(
      (round) => round.city === validated.data.roundCity,
    );
    if (!roundOk) {
      return { success: false, error: "Please select a valid round city." };
    }

    const fee = resolveRobofestFee(content, category.name);
    if (!fee.isPaid || fee.amount <= 0) {
      return {
        success: false,
        error: "This category does not require payment.",
      };
    }

    const duplicate = await hasExistingRobofestRegistration(
      category.name,
      validated.data.email,
    );
    if (duplicate) {
      return {
        success: false,
        error: "You have already registered for this category with this email.",
      };
    }

    const callbackUrl = `${getRobofestBaseUrl()}/api/payments/bkash/success`;
    const checkout = await bkashCreateCheckout({
      amount: fee.amount,
      payerReference: validated.data.phone,
      callbackUrl,
      merchantInvoiceNumber: `RF-${category.slug}-${Date.now()}`.slice(0, 40),
    });

    const now = new Date();
    const pending: PendingRobofestRegistration = {
      kind: "robofest",
      paymentId: checkout.paymentId,
      category: category.name,
      name: validated.data.name,
      school: validated.data.school,
      schoolIsCustom: Boolean(validated.data.schoolIsCustom),
      pendingSchoolId: validated.data.pendingSchoolId,
      email: validated.data.email,
      phone: validated.data.phone,
      teamSize: validated.data.teamSize,
      teamMembers: validated.data.teamMembers,
      roundCity: validated.data.roundCity,
      notes: validated.data.notes ?? "",
      amount: fee.amount,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await adminDb
      .collection("bkash_pending_registrations")
      .doc(checkout.paymentId)
      .set(pending);

    return { success: true, checkoutUrl: checkout.checkoutUrl };
  } catch (error) {
    console.error("Error initiating Robofest bKash checkout:", error);
    return {
      success: false,
      error: "Failed to initiate bKash payment. Please try again.",
    };
  }
}

export async function finalizeRobofestPaidRegistration(paymentId: string): Promise<{
  success: boolean;
  error?: string;
  warning?: string;
  registrationDocId?: string;
  registrationId?: string;
}> {
  try {
    if (!adminDb) {
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again later.",
      };
    }

    const pendingRef = adminDb
      .collection("bkash_pending_registrations")
      .doc(paymentId);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      return { success: false, error: "Payment session not found or expired." };
    }

    const pending = pendingSnap.data() as PendingRobofestRegistration;
    if (pending.kind !== "robofest") {
      return { success: false, error: "Not a Robofest payment session." };
    }

    if (pending.status === "completed" && pending.registrationDocId) {
      return {
        success: true,
        registrationDocId: pending.registrationDocId,
      };
    }

    let execution;
    try {
      execution = await bkashExecutePayment(paymentId);
    } catch (executeError) {
      const isNoResponseFromExecute =
        executeError instanceof BkashApiError
          ? executeError.noResponse
          : false;

      if (!isNoResponseFromExecute) {
        await pendingRef.update({ status: "failed", updatedAt: new Date() });
        return {
          success: false,
          error:
            executeError instanceof BkashApiError
              ? executeError.statusMessage || executeError.message
              : "Failed to execute payment with bKash.",
        };
      }

      try {
        const queried = await bkashQueryPayment(paymentId);
        if (queried.transactionStatus.toLowerCase() !== "completed") {
          await pendingRef.update({ status: "failed", updatedAt: new Date() });
          return {
            success: false,
            error:
              queried.statusMessage ||
              `Payment is not successful (${queried.transactionStatus}).`,
          };
        }
        execution = queried;
      } catch (queryError) {
        await pendingRef.update({ status: "failed", updatedAt: new Date() });
        return {
          success: false,
          error:
            queryError instanceof BkashApiError
              ? queryError.statusMessage || queryError.message
              : "Failed to verify payment status with bKash.",
        };
      }
    }

    if (execution.transactionStatus.toLowerCase() !== "completed") {
      await pendingRef.update({ status: "failed", updatedAt: new Date() });
      return {
        success: false,
        error:
          execution.statusMessage ||
          `Payment is not successful (${execution.transactionStatus}).`,
      };
    }

    const content = await getRobofestContentFresh();
    const result = await createRobofestRegistrationAndSendEmail(
      content,
      {
        category: pending.category,
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        school: pending.school,
        schoolIsCustom: pending.schoolIsCustom,
        pendingSchoolId: pending.pendingSchoolId,
        teamSize: pending.teamSize || pending.teamMembers?.length || 1,
        teamMembers: pending.teamMembers || [],
        roundCity: pending.roundCity,
        notes: pending.notes,
      },
      {
        paymentId: execution.paymentId,
        trxId: execution.trxId,
        amountPaid: execution.amount || pending.amount,
      },
    );

    if (!result.success) {
      await pendingRef.update({ status: "failed", updatedAt: new Date() });
      return result;
    }

    await pendingRef.update({
      status: "completed",
      registrationDocId: result.registrationDocId,
      updatedAt: new Date(),
      trxId: execution.trxId,
    });

    return result;
  } catch (error) {
    console.error("Error finalizing Robofest paid registration:", error);
    return {
      success: false,
      error: "Failed to finalize payment. Please contact support.",
    };
  }
}
