"use server";

import {
  BkashApiError,
  bkashCreateCheckout,
  bkashExecutePayment,
  bkashQueryPayment,
} from "@/lib/bkash";
import { collectionGet, collectionSet } from "@/lib/db/collections";
import {
  getRobofestCategoryByName,
  getRobofestContentFresh,
  resolveRobofestFee,
  type RobofestTeamMember,
} from "@/lib/robofest-content";
import { isRobofestDivisionRegistrationClosed } from "@/lib/robofest-deadlines";
import { computeRobofestRegistrationTotal } from "@/lib/robofest-fee";
import type { RobofestAgeCategory } from "@/lib/robofest-registration-options";
import {
  validateRobofestRegistrationInput,
  type RobofestRegistrationInput,
} from "@/lib/robofest-registration-input";
import {
  createRobofestRegistrationAndSendEmail,
  getRobofestBaseUrl,
  getRobofestRegistrationById,
  hasExistingRobofestRegistration,
} from "@/lib/robofest-registration";

export type { RobofestMemberInput, RobofestRegistrationInput } from "@/lib/robofest-registration-input";

export type RobofestRegistrationResult = {
  success: boolean;
  error?: string;
  warning?: string;
  registrationId?: string;
  registrationDocId?: string;
  teamNumber?: string;
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
  status: "pending" | "processing" | "completed" | "failed";
  registrationDocId?: string;
  registrationId?: string;
  teamNumber?: string;
  trxId?: string;
  paymentCaptured?: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Free registration (or when fee is 0). */
export async function submitRobofestRegistration(
  formData: RobofestRegistrationInput,
): Promise<RobofestRegistrationResult> {
  try {
    const validated = await validateRobofestRegistrationInput(formData);
    if (!validated.ok) return { success: false, error: validated.error };

    const content = await getRobofestContentFresh();
    if (isRobofestDivisionRegistrationClosed(content, validated.data.roundCity)) {
      return {
        success: false,
        error: `Registration for the ${validated.data.roundCity} division is closed. The deadline has passed.`,
      };
    }

    const category = getRobofestCategoryByName(content, validated.data.category);
    if (!category) {
      return { success: false, error: "Selected category is not valid." };
    }

    const roundOk = content.rounds.some(
      (round) =>
        round.city.trim().toLowerCase() ===
        validated.data.roundCity.trim().toLowerCase(),
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
    const validated = await validateRobofestRegistrationInput(formData);
    if (!validated.ok) return { success: false, error: validated.error };

    const content = await getRobofestContentFresh();
    if (isRobofestDivisionRegistrationClosed(content, validated.data.roundCity)) {
      return {
        success: false,
        error: `Registration for the ${validated.data.roundCity} division is closed. The deadline has passed.`,
      };
    }

    const category = getRobofestCategoryByName(content, validated.data.category);
    if (!category) {
      return { success: false, error: "Selected category is not valid." };
    }

    const roundOk = content.rounds.some(
      (round) =>
        round.city.trim().toLowerCase() ===
        validated.data.roundCity.trim().toLowerCase(),
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

    await collectionSet("bkash_pending_registrations", checkout.paymentId, {
      ...pending,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

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
  emailSent?: boolean;
}> {
  try {
    type ClaimResult =
      | {
          ok: true;
          alreadyCompleted: true;
          pending: PendingRobofestRegistration;
        }
      | {
          ok: true;
          alreadyCompleted: false;
          pending: PendingRobofestRegistration;
          skipExecute: boolean;
        }
      | { ok: false; error: string };

    const mergePending = (patch: Record<string, unknown>) =>
      collectionSet("bkash_pending_registrations", paymentId, patch, { merge: true });

    const pendingSnap = await collectionGet("bkash_pending_registrations", paymentId);
    let claim: ClaimResult;
    if (!pendingSnap) {
      claim = { ok: false, error: "Payment session not found or expired." };
    } else {
      const pending = pendingSnap as PendingRobofestRegistration;
      if (pending.kind !== "robofest") {
        claim = { ok: false, error: "Not a Robofest payment session." };
      } else if (pending.status === "completed" && pending.registrationDocId) {
        claim = { ok: true, alreadyCompleted: true, pending };
      } else if (pending.status === "processing") {
        claim = {
          ok: false,
          error:
            "Payment is still being finalized. Please wait a moment and refresh.",
        };
      } else if (pending.status === "failed" && pending.paymentCaptured) {
        await mergePending({
          status: "processing",
          error: null,
          updatedAt: new Date().toISOString(),
        });
        claim = {
          ok: true,
          alreadyCompleted: false,
          pending,
          skipExecute: true,
        };
      } else if (pending.status === "failed") {
        claim = {
          ok: false,
          error:
            pending.error ||
            "This payment session already failed. Please contact support.",
        };
      } else {
        await mergePending({
          status: "processing",
          updatedAt: new Date().toISOString(),
        });
        claim = {
          ok: true,
          alreadyCompleted: false,
          pending,
          skipExecute: false,
        };
      }
    }

    if (!claim.ok) {
      return { success: false, error: claim.error };
    }

    if (claim.alreadyCompleted) {
      let registrationId = claim.pending.registrationId;
      if (!registrationId && claim.pending.registrationDocId) {
        const existing = await getRobofestRegistrationById(
          claim.pending.registrationDocId,
        );
        registrationId = existing?.registrationId;
      }
      return {
        success: true,
        registrationDocId: claim.pending.registrationDocId,
        registrationId,
        emailSent: true,
      };
    }

    const pending = claim.pending;
    let execution: {
      paymentId: string;
      trxId: string;
      amount: number;
      transactionStatus: string;
      statusMessage?: string;
    };

    if (claim.skipExecute) {
      execution = {
        paymentId,
        trxId: pending.trxId || "",
        amount: pending.amount,
        transactionStatus: "Completed",
      };
    } else {
      try {
        execution = await bkashExecutePayment(paymentId);
      } catch (executeError) {
        const isNoResponseFromExecute =
          executeError instanceof BkashApiError
            ? executeError.noResponse
            : false;

        if (!isNoResponseFromExecute) {
          await mergePending({
            status: "failed",
            paymentCaptured: false,
            error:
              executeError instanceof BkashApiError
                ? executeError.statusMessage || executeError.message
                : "Failed to execute payment with bKash.",
            updatedAt: new Date().toISOString(),
          });
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
            await mergePending({
              status: "failed",
              paymentCaptured: false,
              error:
                queried.statusMessage ||
                `Payment is not successful (${queried.transactionStatus}).`,
              updatedAt: new Date().toISOString(),
            });
            return {
              success: false,
              error:
                queried.statusMessage ||
                `Payment is not successful (${queried.transactionStatus}).`,
            };
          }
          execution = queried;
        } catch (queryError) {
          await mergePending({
            status: "failed",
            paymentCaptured: false,
            error:
              queryError instanceof BkashApiError
                ? queryError.statusMessage || queryError.message
                : "Failed to verify payment status with bKash.",
            updatedAt: new Date().toISOString(),
          });
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
        await mergePending({
          status: "failed",
          paymentCaptured: false,
          error:
            execution.statusMessage ||
            `Payment is not successful (${execution.transactionStatus}).`,
          updatedAt: new Date().toISOString(),
        });
        return {
          success: false,
          error:
            execution.statusMessage ||
            `Payment is not successful (${execution.transactionStatus}).`,
        };
      }

      // Payment confirmed — mark captured before registration create.
      await mergePending({
        paymentCaptured: true,
        trxId: execution.trxId,
        updatedAt: new Date().toISOString(),
      });
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
          paymentId: execution.paymentId || paymentId,
          trxId: execution.trxId || pending.trxId,
          amountPaid: execution.amount || pending.amount,
        },
      },
    );

    if (!result.success) {
      console.error(
        "[robofest] Payment captured but registration create failed",
        {
          paymentId,
          trxId: execution.trxId || pending.trxId,
          error: result.error,
        },
      );
      await mergePending({
        status: "failed",
        paymentCaptured: true,
        trxId: execution.trxId || pending.trxId || null,
        error: result.error || "Failed to create registration after payment.",
        updatedAt: new Date().toISOString(),
      });
      return result;
    }

    await mergePending({
      status: "completed",
      registrationDocId: result.registrationDocId,
      registrationId: result.registrationId,
      teamNumber: result.teamNumber || null,
      trxId: execution.trxId || pending.trxId || null,
      paymentCaptured: true,
      error: null,
      updatedAt: new Date().toISOString(),
    });

    return {
      ...result,
      emailSent: result.emailSent === true,
    };
  } catch (error) {
    console.error("Error finalizing Robofest paid registration:", error);
    return {
      success: false,
      error: "Failed to finalize payment. Please contact support.",
    };
  }
}
