/**
 * Shared Robofest registration input validation (server-only).
 */

import {
  createPendingSchoolIfNeeded,
  resolveSchoolFromSelection,
} from "@/lib/pendingSchool";
import { getActiveRobofestCampusAmbassadorById } from "@/lib/robofest-campus-ambassadors-db";
import type { RobofestTeamMember } from "@/lib/robofest-content";
import {
  formatAgeCategoryLabel,
  isGradeAllowedForAgeCategory,
  type RobofestAgeCategory,
} from "@/lib/robofest-registration-options";
import type { RobofestRegistrationFormData } from "@/lib/robofest-registration";

export type RobofestMemberInput = {
  name: string;
  email: string;
  phone: string;
  schoolSelection: string;
  customSchool?: string;
  branch?: string;
  grade: string;
};

export type RobofestRegistrationInput = {
  category: string;
  /** Ignored — server assigns team number as the team name. */
  name?: string;
  division: string;
  ageCategory: string;
  teamSize: number;
  teamMembers: RobofestMemberInput[];
  campusAmbassadorId?: string;
  notes?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function validateRobofestRegistrationInput(
  formData: RobofestRegistrationInput,
): Promise<
  | { ok: true; data: RobofestRegistrationFormData }
  | { ok: false; error: string }
> {
  const category = formData.category?.trim() ?? "";
  const division = formData.division?.trim() ?? "";
  const ageCategoryRaw = formData.ageCategory?.trim() ?? "";
  const ageCategory: RobofestAgeCategory | null =
    ageCategoryRaw === "explorer" || ageCategoryRaw === "innovators"
      ? ageCategoryRaw
      : null;

  if (!category || !division || !ageCategory) {
    return { ok: false, error: "All required fields must be filled." };
  }

  const teamSize = Math.min(4, Math.max(1, Number(formData.teamSize) || 0));
  if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 4) {
    return { ok: false, error: "Number of members must be between 1 and 4." };
  }

  const list = Array.isArray(formData.teamMembers)
    ? formData.teamMembers.slice(0, teamSize)
    : [];
  if (list.length !== teamSize) {
    return {
      ok: false,
      error: `Please provide details for all ${teamSize} team member(s).`,
    };
  }

  const teamMembers: RobofestTeamMember[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const raw = list[i];
    const memberName = raw?.name?.trim() ?? "";
    const email = raw?.email?.trim().toLowerCase() ?? "";
    const phone = raw?.phone?.trim().replace(/\s/g, "") ?? "";
    const schoolSelection = raw?.schoolSelection?.trim() ?? "";
    const customSchool = raw?.customSchool?.trim() ?? "";
    const branch = raw?.branch?.trim() ?? "";
    const grade = raw?.grade?.trim() ?? "";

    if (!memberName || !email || !phone || !schoolSelection || !grade) {
      return {
        ok: false,
        error: `Team member ${String(i + 1).padStart(2, "0")} is missing required fields.`,
      };
    }
    if (!EMAIL_REGEX.test(email)) {
      return {
        ok: false,
        error: `Team member ${String(i + 1).padStart(2, "0")} has an invalid email.`,
      };
    }
    if (phone.length !== 11 || !phone.startsWith("01")) {
      return {
        ok: false,
        error: `Team member ${String(i + 1).padStart(2, "0")} phone must be 11 digits starting with 01.`,
      };
    }
    if (!isGradeAllowedForAgeCategory(grade, ageCategory)) {
      return {
        ok: false,
        error: `Team member ${String(i + 1).padStart(2, "0")} grade does not match ${formatAgeCategoryLabel(ageCategory)}.`,
      };
    }

    const resolved = resolveSchoolFromSelection(schoolSelection, customSchool);
    if (!resolved.school) {
      return {
        ok: false,
        error: `Team member ${String(i + 1).padStart(2, "0")} needs an institution name.`,
      };
    }

    let school = resolved.school;
    let schoolIsCustom = resolved.isCustom;
    let pendingSchoolId: string | undefined;

    if (resolved.isCustom) {
      const pending = await createPendingSchoolIfNeeded(resolved.school, {
        requestedByName: memberName,
        requestedByEmail: email,
        source: "robofest",
      });
      school = pending.school;
      schoolIsCustom = pending.schoolIsCustom;
      pendingSchoolId = pending.pendingSchoolId;
    }

    teamMembers.push({
      name: memberName,
      email,
      phone,
      school,
      schoolIsCustom,
      pendingSchoolId,
      branch: branch || undefined,
      grade,
    });
  }

  const primary = teamMembers[0];
  if (!primary) {
    return { ok: false, error: "At least one team member is required." };
  }

  let campusAmbassadorId: string | undefined;
  let campusAmbassadorName: string | undefined;
  let campusAmbassadorSchool: string | undefined;
  const ambassadorId = formData.campusAmbassadorId?.trim() ?? "";
  if (ambassadorId) {
    const ambassador = await getActiveRobofestCampusAmbassadorById(ambassadorId);
    if (!ambassador) {
      return { ok: false, error: "Selected campus ambassador is not valid." };
    }
    campusAmbassadorId = ambassador.id;
    campusAmbassadorName = ambassador.name;
    campusAmbassadorSchool = ambassador.school;
  }

  return {
    ok: true,
    data: {
      category,
      // Placeholder until create allocates team number and overwrites name.
      name: "",
      email: primary.email,
      phone: primary.phone || "",
      school: primary.school || "",
      schoolIsCustom: Boolean(primary.schoolIsCustom),
      pendingSchoolId: primary.pendingSchoolId,
      ageCategory,
      teamSize,
      teamMembers,
      campusAmbassadorId,
      campusAmbassadorName,
      campusAmbassadorSchool,
      roundCity: division,
      notes: formData.notes?.trim() ?? "",
    },
  };
}
