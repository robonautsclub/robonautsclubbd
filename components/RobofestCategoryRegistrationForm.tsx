"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { computeRobofestRegistrationTotal } from "@/lib/robofest-fee";
import type { RobofestRoundContent } from "@/lib/robofest-content";
import {
  PRIVATE_CANDIDATE_OPTION,
  SCHOOL_NOT_FOUND_OPTION,
} from "@/lib/schoolDirectory";
import {
  formatCampusAmbassadorLabel,
  ROBOFEST_CAMPUS_AMBASSADORS,
} from "@/lib/robofest-campus-ambassadors";
import {
  getGradesForAgeCategory,
  ROBOFEST_AGE_CATEGORIES,
  ROBOFEST_DIVISIONS,
  type RobofestAgeCategory,
} from "@/lib/robofest-registration-options";
import {
  initiateRobofestPaidCheckout,
  submitRobofestRegistration,
} from "@/app/(marketing)/robofest/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TeamMemberForm = {
  name: string;
  email: string;
  phone: string;
  schoolSelection: string;
  customSchool: string;
  branch: string;
  grade: string;
};

type FormState = {
  name: string;
  division: string;
  ageCategory: RobofestAgeCategory | "";
  teamSize: number;
  teamMembers: TeamMemberForm[];
  campusAmbassadorId: string;
};

const emptyMember = (): TeamMemberForm => ({
  name: "",
  email: "",
  phone: "",
  schoolSelection: "",
  customSchool: "",
  branch: "",
  grade: "",
});

const emptyForm = (division: string): FormState => ({
  name: "",
  division,
  ageCategory: "",
  teamSize: 1,
  teamMembers: [emptyMember()],
  campusAmbassadorId: "",
});

function resizeTeamMembers(
  members: TeamMemberForm[],
  size: number,
): TeamMemberForm[] {
  const next = members.slice(0, size);
  while (next.length < size) {
    next.push(emptyMember());
  }
  return next;
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function RobofestCategoryRegistrationForm({
  category,
  rounds,
  schools,
  isPaid,
  amount,
  rulesPdf,
  registrationClosed = false,
}: {
  category: string;
  rounds: RobofestRoundContent[];
  schools: string[];
  isPaid: boolean;
  amount: number;
  rulesPdf?: string;
  registrationClosed?: boolean;
}) {
  const divisionOptions = useMemo(() => {
    const fromRounds = rounds
      .map((round) => {
        const match = ROBOFEST_DIVISIONS.find((d) => d.value === round.city);
        return match ?? { value: round.city, label: `${round.city} Division` };
      })
      .filter((d, i, arr) => arr.findIndex((x) => x.value === d.value) === i);
    return fromRounds.length > 0 ? fromRounds : ROBOFEST_DIVISIONS;
  }, [rounds]);

  const defaultDivision = divisionOptions[0]?.value ?? "Dhaka";
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultDivision));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [rulesUnderstood, setRulesUnderstood] = useState(false);

  const gradeOptions = getGradesForAgeCategory(form.ageCategory);
  const totalAmount =
    isPaid && amount > 0
      ? computeRobofestRegistrationTotal(amount, form.teamSize)
      : 0;

  const fieldId = (field: string) =>
    `robofest-${field}-${category.replace(/\s+/g, "-").toLowerCase()}`;

  const updateTeamSize = (event: ChangeEvent<HTMLSelectElement>) => {
    const size = Math.min(4, Math.max(1, Number(event.target.value) || 1));
    setForm((prev) => ({
      ...prev,
      teamSize: size,
      teamMembers: resizeTeamMembers(prev.teamMembers, size),
    }));
  };

  const updateAgeCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    const ageCategory = event.target.value as RobofestAgeCategory | "";
    setForm((prev) => ({
      ...prev,
      ageCategory,
      teamMembers: prev.teamMembers.map((member) => {
        const allowed = getGradesForAgeCategory(ageCategory);
        return {
          ...member,
          grade: allowed.includes(member.grade) ? member.grade : "",
        };
      }),
    }));
  };

  const updateMember =
    (index: number, field: keyof TeamMemberForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        const teamMembers = prev.teamMembers.map((member, i) =>
          i === index ? { ...member, [field]: value } : member,
        );
        return { ...prev, teamMembers };
      });
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setWarning("");

    if (registrationClosed) {
      setError("Registration is closed for this event.");
      return;
    }

    if (!rulesUnderstood) {
      setError(
        "Please confirm that you have read and understood the category rulebook.",
      );
      return;
    }

    if (isPaid && amount > 0 && !understood) {
      setError(
        "Please confirm that you understand the fee and payment instructions.",
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      category,
      name: form.name,
      division: form.division,
      ageCategory: form.ageCategory,
      teamSize: form.teamSize,
      teamMembers: form.teamMembers.slice(0, form.teamSize).map((m) => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
        schoolSelection: m.schoolSelection,
        customSchool: m.customSchool,
        branch: m.branch,
        grade: m.grade,
      })),
      campusAmbassadorId: form.campusAmbassadorId || undefined,
    };

    try {
      if (isPaid && amount > 0) {
        const result = await initiateRobofestPaidCheckout(payload);
        if (!result.success || !result.checkoutUrl) {
          setError(result.error || "Failed to start payment.");
          return;
        }
        window.location.href = result.checkoutUrl;
        return;
      }

      const result = await submitRobofestRegistration(payload);
      if (!result.success) {
        setError(result.error || "Failed to submit registration.");
        return;
      }

      setRegistrationId(result.registrationId ?? null);
      if (result.warning) setWarning(result.warning);
      setIsSubmitted(true);
      setForm(emptyForm(defaultDivision));
    } catch {
      setError("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationClosed) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Registration closed</AlertTitle>
        <AlertDescription>
          The registration deadline has passed. New team registrations are no
          longer accepted online.
        </AlertDescription>
      </Alert>
    );
  }

  if (isSubmitted) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900">
        <AlertTitle>Registration confirmed</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Thanks for registering for {category}. A confirmation email
            {isPaid ? "" : " with PDF"} has been sent.
          </p>
          {registrationId ? (
            <p className="font-mono text-sm font-semibold">
              ID: {registrationId}
            </p>
          ) : null}
          {warning ? <p className="text-amber-800 text-sm">{warning}</p> : null}
        </AlertDescription>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setIsSubmitted(false);
            setError("");
            setWarning("");
            setRegistrationId(null);
          }}
        >
          Register another team
        </Button>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("competition")}
          className="text-sm font-medium text-gray-700"
        >
          Competition
        </label>
        <Input
          id={fieldId("competition")}
          value={category}
          readOnly
          className="bg-gray-50"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("team-name")}
          className="text-sm font-medium text-gray-700"
        >
          Team name
        </label>
        <Input
          id={fieldId("team-name")}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Team Robonauts"
          required
          autoComplete="organization"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("division")}
          className="text-sm font-medium text-gray-700"
        >
          Select Division <span className="text-red-500">*</span>
        </label>
        <select
          id={fieldId("division")}
          value={form.division}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, division: e.target.value }))
          }
          required
          className={selectClassName}
        >
          <option value="">Select division</option>
          {divisionOptions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("age-category")}
          className="text-sm font-medium text-gray-700"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id={fieldId("age-category")}
          value={form.ageCategory}
          onChange={updateAgeCategory}
          required
          className={selectClassName}
        >
          <option value="">Select category</option>
          {ROBOFEST_AGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("team-size")}
          className="text-sm font-medium text-gray-700"
        >
          Number of Members <span className="text-red-500">*</span>
        </label>
        <select
          id={fieldId("team-size")}
          value={form.teamSize}
          onChange={updateTeamSize}
          required
          className={selectClassName}
        >
          {[1, 2, 3, 4].map((size) => (
            <option key={size} value={size}>
              {String(size).padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {form.teamMembers.slice(0, form.teamSize).map((member, index) => (
          <fieldset
            key={`member-${index}`}
            className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3"
          >
            <legend className="px-1 text-sm font-semibold text-gray-800">
              Team member {String(index + 1).padStart(2, "0")}
            </legend>

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-name`)}
                className="text-sm font-medium text-gray-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id={fieldId(`member-${index}-name`)}
                value={member.name}
                onChange={updateMember(index, "name")}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-email`)}
                className="text-sm font-medium text-gray-700"
              >
                E-Mail Address <span className="text-red-500">*</span>
              </label>
              <Input
                id={fieldId(`member-${index}-email`)}
                type="email"
                value={member.email}
                onChange={updateMember(index, "email")}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-phone`)}
                className="text-sm font-medium text-gray-700"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                id={fieldId(`member-${index}-phone`)}
                type="tel"
                value={member.phone}
                onChange={updateMember(index, "phone")}
                placeholder="01XXXXXXXXX"
                required
                inputMode="numeric"
                autoComplete="tel"
              />
              <p className="text-xs text-gray-500">11 digits starting with 01</p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-school`)}
                className="text-sm font-medium text-gray-700"
              >
                Institution Name <span className="text-red-500">*</span>
              </label>
              <select
                id={fieldId(`member-${index}-school`)}
                value={member.schoolSelection}
                onChange={updateMember(index, "schoolSelection")}
                required
                className={selectClassName}
              >
                <option value="">Select institution</option>
                <option value={PRIVATE_CANDIDATE_OPTION}>
                  {PRIVATE_CANDIDATE_OPTION}
                </option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
                <option value={SCHOOL_NOT_FOUND_OPTION}>
                  School not found (type manually)
                </option>
              </select>
            </div>

            {member.schoolSelection === SCHOOL_NOT_FOUND_OPTION ? (
              <div className="space-y-1.5">
                <label
                  htmlFor={fieldId(`member-${index}-custom-school`)}
                  className="text-sm font-medium text-gray-700"
                >
                  Enter institution name <span className="text-red-500">*</span>
                </label>
                <Input
                  id={fieldId(`member-${index}-custom-school`)}
                  value={member.customSchool}
                  onChange={updateMember(index, "customSchool")}
                  required
                  autoComplete="organization"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-branch`)}
                className="text-sm font-medium text-gray-700"
              >
                Branch{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                id={fieldId(`member-${index}-branch`)}
                value={member.branch}
                onChange={updateMember(index, "branch")}
                placeholder="Campus / branch"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-grade`)}
                className="text-sm font-medium text-gray-700"
              >
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                id={fieldId(`member-${index}-grade`)}
                value={member.grade}
                onChange={updateMember(index, "grade")}
                required
                disabled={!form.ageCategory}
                className={selectClassName}
              >
                <option value="">
                  {form.ageCategory
                    ? "Select grade"
                    : "Select category first"}
                </option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("ambassador")}
          className="text-sm font-medium text-gray-700"
        >
          Campus Ambassador{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          id={fieldId("ambassador")}
          value={form.campusAmbassadorId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              campusAmbassadorId: e.target.value,
            }))
          }
          className={selectClassName}
        >
          <option value="">None</option>
          {ROBOFEST_CAMPUS_AMBASSADORS.map((a) => (
            <option key={a.id} value={a.id}>
              {formatCampusAmbassadorLabel(a)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not submit</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2.5">
        <label
          htmlFor={fieldId("rules-understood")}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 cursor-pointer"
        >
          <Checkbox
            id={fieldId("rules-understood")}
            checked={rulesUnderstood}
            onCheckedChange={(checked) => setRulesUnderstood(checked === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-slate-700 leading-snug">
            Yes, I have read and understood the rules found in the rulebook for{" "}
            <span className="font-semibold">{category}</span>
            {rulesPdf ? (
              <>
                {" "}
                (
                <a
                  href={rulesPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-cyan-700 underline underline-offset-2 hover:text-cyan-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  open rulebook
                </a>
                )
              </>
            ) : null}
            .
          </span>
        </label>

        {isPaid && amount > 0 ? (
          <label
            htmlFor={fieldId("understood")}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 cursor-pointer"
          >
            <Checkbox
              id={fieldId("understood")}
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-slate-700 leading-snug">
              I understand the registration fee is{" "}
              <span className="font-semibold">BDT {totalAmount}</span> (
              {form.teamSize} member{form.teamSize === 1 ? "" : "s"} × BDT{" "}
              {amount}), and after paying on bKash I will not close or leave
              this browser until I see the registration successful message.
            </span>
          </label>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={
          isSubmitting ||
          !rulesUnderstood ||
          (isPaid && amount > 0 && !understood)
        }
        className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
      >
        {isSubmitting
          ? isPaid
            ? "Redirecting to bKash…"
            : "Submitting…"
          : isPaid
            ? `Pay BDT ${totalAmount} to confirm registration`
            : "Submit registration"}
      </Button>
    </form>
  );
}
