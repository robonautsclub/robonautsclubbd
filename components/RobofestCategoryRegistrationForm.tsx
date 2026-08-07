"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { RobofestRoundContent } from "@/lib/robofest-content";
import {
  initiateRobofestPaidCheckout,
  submitRobofestRegistration,
} from "@/app/(marketing)/robofest/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type FormState = {
  name: string;
  email: string;
  phone: string;
  school: string;
  roundCity: string;
  notes: string;
};

export default function RobofestCategoryRegistrationForm({
  category,
  rounds,
  isPaid,
  amount,
}: {
  category: string;
  rounds: RobofestRoundContent[];
  isPaid: boolean;
  amount: number;
}) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    school: "",
    roundCity: rounds[0]?.city ?? "Dhaka",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const fieldId = (field: string) =>
    `robofest-${field}-${category.replace(/\s+/g, "-").toLowerCase()}`;

  const updateField =
    (field: keyof FormState) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
      school: form.school,
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
      setForm({
        name: "",
        email: "",
        phone: "",
        school: "",
        roundCity: rounds[0]?.city ?? "Dhaka",
        notes: "",
      });
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
          Email
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
          Phone
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
        <Input
          id={fieldId("school")}
          value={form.school}
          onChange={updateField("school")}
          placeholder="Your school or institution"
          required
        />
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
