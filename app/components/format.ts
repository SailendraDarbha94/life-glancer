// Small client-side formatting helpers shared by the widgets.

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Friendly date for a due/inquiry date that is a plain YYYY-MM-DD.
export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return iso < new Date().toISOString().slice(0, 10);
}

// Map a Google Drive mimeType to a short label.
export function driveKind(mimeType: string): string {
  if (mimeType.includes("folder")) return "Folder";
  if (mimeType.includes("spreadsheet")) return "Sheet";
  if (mimeType.includes("presentation")) return "Slides";
  if (mimeType.includes("document")) return "Doc";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.includes("form")) return "Form";
  return "File";
}
