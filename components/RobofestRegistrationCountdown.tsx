"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseRegistrationClosingInstant } from "@/lib/dateUtils";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function getRemaining(closingDate: string, now: Date): Remaining {
  const target = parseRegistrationClosingInstant(closingDate);
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function RobofestRegistrationCountdown({
  closingDate,
  className,
  compact = false,
}: {
  closingDate: string;
  className?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(
    () => getRemaining(closingDate, now),
    [closingDate, now],
  );

  const dateLabel = useMemo(() => {
    const instant = parseRegistrationClosingInstant(closingDate);
    if (!instant) return closingDate;
    const hasTime = closingDate.includes("T");
    return format(instant, hasTime ? "MMM d, yyyy · h:mm a" : "MMM d, yyyy");
  }, [closingDate]);

  if (remaining.expired) {
    return (
      <div
        className={cn(
          "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800",
          className,
        )}
      >
        Registration closed
        <span className="ml-2 font-normal text-rose-700/80">
          (deadline was {dateLabel})
        </span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hours", value: remaining.hours },
    { label: "Mins", value: remaining.minutes },
    { label: "Secs", value: remaining.seconds },
  ] as const;

  return (
    <div
      className={cn(
        "rounded-xl border border-cyan-200/80 bg-cyan-50/80 px-4 py-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-2",
          compact ? "justify-between" : "justify-between sm:gap-6",
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-800/80">
            Registration closes
          </p>
          <p className="text-sm font-semibold text-slate-900">{dateLabel}</p>
        </div>
        <div
          className="flex items-center gap-2 sm:gap-3"
          aria-live="polite"
          aria-atomic="true"
        >
          {units.map((unit, index) => (
            <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
              {index > 0 ? (
                <span className="text-slate-300 font-bold select-none" aria-hidden>
                  :
                </span>
              ) : null}
              <div className="text-center min-w-10">
                <div className="text-lg sm:text-xl font-bold tabular-nums text-slate-900 leading-none">
                  {unit.label === "Days" ? unit.value : pad(unit.value)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                  {unit.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
