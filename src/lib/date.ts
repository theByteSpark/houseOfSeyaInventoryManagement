// isTerminal covers statuses where completion tracking no longer applies
// (e.g. a sale marked DONE or a purchase marked IN_STOCK) — completionDate
// is overwritten to the actual completion date at that point, so days-left
// is meaningless and should not be shown.
export function getDaysLeft(completionDate: string | null, isTerminal = false): number | null {
  if (!completionDate || isTerminal) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(completionDate);
  target.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

export function getDaysLeftTone(daysLeft: number | null): 'neutral' | 'warning' | 'danger' {
  if (daysLeft === null) return 'neutral';
  if (daysLeft < 1) return 'danger';
  if (daysLeft < 3) return 'warning';
  return 'neutral';
}

export function formatDaysLeft(daysLeft: number | null): string {
  if (daysLeft === null) return '—';
  if (daysLeft <= 0) return 'Overdue';
  return `${daysLeft}`;
}
