"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { RobofestRoundContent } from "@/lib/robofest-content";
import {
  PRIVATE_CANDIDATE_OPTION,
  SCHOOL_NOT_FOUND_OPTION,
} from "@/lib/schoolDirectory";
import {
  initiateRobofestPaidCheckout,
  submitRobofestRegistration,
} from "@/app/(marketing)/robofest/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type TeamMemberForm = {
  name: string;
  email: string;
  grade: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  schoolSelection: string;
  customSchool: string;
  teamSize: number;
  teamMembers: TeamMemberForm[];
  roundCity: string;
  notes: string;
};

const emptyMember = (): TeamMemberForm => ({
  name: "",
  email: "",
  grade: "",
});

const emptyForm = (roundCity: string): FormState => ({
  name: "",
  email: "",
  phone: "",
  schoolSelection: "",
  customSchool: "",
  teamSize: 1,
  teamMembers: [emptyMember()],
  roundCity,
  notes: "",
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

export default function RobofestCategoryRegistrationForm({
  category,
  rounds,
  schools,
  isPaid,
  amount,
}: {
  category: string;
  rounds: RobofestRoundContent[];
  schools: string[];
  isPaid: boolean;
  amount: number;
}) {
  const defaultRound = rounds[0]?.city ?? "Dhaka";
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultRound));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const fieldId = (field: string) =>
    `robofest-${field}-${category.replace(/\s+/g, "-").toLowerCase()}`;

  const updateField =
    (field: keyof Omit<FormState, "teamMembers" | "teamSize">) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const updateTeamSize = (event: ChangeEvent<HTMLSelectElement>) => {
    const size = Math.min(4, Math.max(1, Number(event.target.value) || 1));
    setForm((prev) => ({
      ...prev,
      teamSize: size,
      teamMembers: resizeTeamMembers(prev.teamMembers, size),
    }));
  };

  const updateMember =
    (index: number, field: keyof TeamMemberForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
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
    setIsSubmitting(true);

    const payload = {
      category,
      name: form.name,
      email: form.email,
      phone: form.phone,
      schoolSelection: form.schoolSelection,
      customSchool: form.customSchool,
      teamSize: form.teamSize,
      teamMembers: form.teamMembers.slice(0, form.teamSize),
      roundCity: form.roundCity,
      notes: form.notes,
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
      setForm(emptyForm(rounds[0]?.city ?? "Dhaka"));
    } catch {
      setError("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          htmlFor={fieldId("category")}
          className="text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <Input
          id={fieldId("category")}
          value={category}
          readOnly
          className="bg-gray-50"
        />
      </div>

      {isPaid && amount > 0 ? (
        <Alert className="border-indigo-200 bg-indigo-50">
          <AlertTitle className="text-indigo-900">Registration fee</AlertTitle>
          <AlertDescription className="text-indigo-800">
            BDT {amount} via bKash after you submit.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("name")}
          className="text-sm font-medium text-gray-700"
        >
          Team / participant name
        </label>
        <Input
          id={fieldId("name")}
          value={form.name}
          onChange={updateField("name")}
          placeholder="Team Robonauts"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("email")}
          className="text-sm font-medium text-gray-700"
        >
          Contact email
        </label>
        <Input
          id={fieldId("email")}
          type="email"
          value={form.email}
          onChange={updateField("email")}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("phone")}
          className="text-sm font-medium text-gray-700"
        >
          Contact phone
        </label>
        <Input
          id={fieldId("phone")}
          type="tel"
          value={form.phone}
          onChange={updateField("phone")}
          placeholder="01XXXXXXXXX"
          required
          autoComplete="tel"
          inputMode="numeric"
        />
        <p className="text-xs text-gray-500">11 digits starting with 01</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("school")}
          className="text-sm font-medium text-gray-700"
        >
          School / institution
        </label>
        <select
          id={fieldId("school")}
          value={form.schoolSelection}
          onChange={updateField("schoolSelection")}
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">Select school</option>
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

      {form.schoolSelection === SCHOOL_NOT_FOUND_OPTION ? (
        <div className="space-y-1.5">
          <label
            htmlFor={fieldId("custom-school")}
            className="text-sm font-medium text-gray-700"
          >
            Enter school name
          </label>
          <Input
            id={fieldId("custom-school")}
            value={form.customSchool}
            onChange={updateField("customSchool")}
            placeholder="Your school or institution"
            required
            autoComplete="organization"
          />
          <p className="text-xs text-gray-500">
            We’ll review new school names before adding them to the directory.
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("team-size")}
          className="text-sm font-medium text-gray-700"
        >
          Team size
        </label>
        <select
          id={fieldId("team-size")}
          value={form.teamSize}
          onChange={updateTeamSize}
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {[1, 2, 3, 4].map((size) => (
            <option key={size} value={size}>
              {size} {size === 1 ? "person" : "people"}
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
              Team member {index + 1}
            </legend>
            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-name`)}
                className="text-sm font-medium text-gray-700"
              >
                Full name
              </label>
              <Input
                id={fieldId(`member-${index}-name`)}
                value={member.name}
                onChange={updateMember(index, "name")}
                placeholder="Member full name"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-email`)}
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id={fieldId(`member-${index}-email`)}
                type="email"
                value={member.email}
                onChange={updateMember(index, "email")}
                placeholder="member@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={fieldId(`member-${index}-grade`)}
                className="text-sm font-medium text-gray-700"
              >
                Grade / class
              </label>
              <Input
                id={fieldId(`member-${index}-grade`)}
                value={member.grade}
                onChange={updateMember(index, "grade")}
                placeholder="e.g. Grade 8"
                required
              />
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("round")}
          className="text-sm font-medium text-gray-700"
        >
          Preferred round
        </label>
        <select
          id={fieldId("round")}
          value={form.roundCity}
          onChange={updateField("roundCity")}
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {rounds.map((round) => (
            <option key={round.city} value={round.city}>
              {round.city} · {round.dates}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={fieldId("notes")}
          className="text-sm font-medium text-gray-700"
        >
          Notes{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Textarea
          id={fieldId("notes")}
          value={form.notes}
          onChange={updateField("notes")}
          placeholder="Anything we should know about your team?"
          rows={3}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not submit</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
      >
        {isSubmitting
          ? isPaid
            ? "Redirecting to bKash…"
            : "Submitting…"
          : isPaid
            ? `Pay BDT ${amount} & register`
            : "Submit registration"}
      </Button>
    </form>
  );
}
