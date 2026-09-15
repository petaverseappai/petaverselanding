import type { Tone } from "@/components/admin/ui";
import type { UserStatus } from "@/types/admin.types";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

export function userStatusTone(status: UserStatus): Tone {
  switch (status) {
    case "Active":
      return "green";
    case "Suspended":
      return "amber";
    case "Banned":
      return "red";
    default:
      return "gray";
  }
}

// ReportStatus int -> tone
export function reportStatusTone(status: number): Tone {
  switch (status) {
    case 0:
      return "amber"; // Open
    case 1:
      return "blue"; // UnderReview
    case 2:
      return "green"; // ActionTaken
    case 3:
      return "gray"; // Dismissed
    default:
      return "gray";
  }
}

export function jobResultTone(result: string | null): Tone {
  if (!result) return "gray";
  return result.toLowerCase() === "succeeded" ? "green" : "red";
}

export function healthTone(v: string): Tone {
  return v === "up" ? "green" : "red";
}

// Extract a { message } from an axios error, with a fallback.
export function errMessage(e: unknown, fallback: string): string {
  const anyE = e as { response?: { data?: { message?: string } } };
  return anyE?.response?.data?.message ?? fallback;
}
