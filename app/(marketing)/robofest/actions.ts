"use server";

import {
  BkashApiError,
  bkashCreateCheckout,
  bkashExecutePayment,
  bkashQueryPayment,
} from "@/lib/bkash";
import { adminDb } from "@/lib/firebase-admin";
import {
  getRobofestCategoryByName,
  getRobofestContentFresh,
  resolveRobofestFee,
  type RobofestTeamMember,
} from "@/lib/robofest-content";
import { computeRobofestRegistrationTotal } from "@/lib/robofest-fee";
import type { RobofestAgeCategory } from "@/lib/robofest-registration-options";
import {
  validateRobofestRegistrationInput,
  type RobofestRegistrationInput,
} from "@/lib/robofest-registration-input";
import {
  createRobofestRegistrationAndSendEmail,
  getRobofestBaseUrl,
  hasExistingRobofestRegistration,
} from "@/lib/robofest-registration";

export type { RobofestMemberInput, RobofestRegistrationInput } from "@/lib/robofest-registration-input";

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
  ageCategory: RobofestAgeCategory;
  teamSize: number;
  teamMembers: RobofestTeamMember[];
  campusAmbassadorId?: string;
  campusAmbassadorName?: string;
  campusAmbassadorSchool?: string;
  roundCity: string;
  notes: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  registrationDocId?: string;
  createdAt: Date;
  updatedAt: Date;
};

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

    const validated = await validateRobofestRegistrationInput(formData);
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
      return { success: false, error: "Please select a valid division." };
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

    const validated = await validateRobofestRegistrationInput(formData);
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
      return { success: false, error: "Please select a valid division." };
    }

    const fee = resolveRobofestFee(content, category.name);
    if (!fee.isPaid || fee.amount <= 0) {
      return {
        success: false,
        error: "This category does not require payment.",
      };
    }

    const totalAmount = computeRobofestRegistrationTotal(
      fee.amount,
      validated.data.teamSize,
    );
    if (totalAmount <= 0) {
      return {
        success: false,
        error: "Invalid registration fee. Please contact support.",
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
      amount: totalAmount,
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
      ageCategory: validated.data.ageCategory,
      teamSize: validated.data.teamSize,
      teamMembers: validated.data.teamMembers,
      campusAmbassadorId: validated.data.campusAmbassadorId,
      campusAmbassadorName: validated.data.campusAmbassadorName,
      campusAmbassadorSchool: validated.data.campusAmbassadorSchool,
      roundCity: validated.data.roundCity,
      notes: validated.data.notes ?? "",
      amount: totalAmount,
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
        ageCategory: pending.ageCategory || "explorer",
        teamSize: pending.teamSize || pending.teamMembers?.length || 1,
        teamMembers: pending.teamMembers || [],
        campusAmbassadorId: pending.campusAmbassadorId,
        campusAmbassadorName: pending.campusAmbassadorName,
        campusAmbassadorSchool: pending.campusAmbassadorSchool,
        roundCity: pending.roundCity,
        notes: pending.notes,
      },
      {
        paymentMeta: {
          paymentId: execution.paymentId,
          trxId: execution.trxId,
          amountPaid: execution.amount || pending.amount,
        },
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
