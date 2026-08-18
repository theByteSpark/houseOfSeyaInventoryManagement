// Lightweight subsequence-based fuzzy match (no dependency needed). Every
// character of the query must appear in the target, in order, but not
// necessarily contiguously — e.g. "ssd" matches "Stainless Steel Disc".
// Returns a score (lower is a better match) or null if it doesn't match at
// all, so callers can both filter and rank results.
export function fuzzyScore(query: string, target: string): number | null {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;

  let qIndex = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let tIndex = 0; tIndex < t.length && qIndex < q.length; tIndex++) {
    if (t[tIndex] === q[qIndex]) {
      // Consecutive matches score better than scattered ones; an exact
      // substring match ends up with the lowest (best) score.
      score += lastMatchIndex === tIndex - 1 ? 0 : tIndex - lastMatchIndex;
      lastMatchIndex = tIndex;
      qIndex++;
    }
  }

  if (qIndex < q.length) return null;
  // Slight bonus for matches that start earlier in the string.
  return score + t.indexOf(q[0]) * 0.1;
}

export function fuzzyFilter<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((r): r is { item: T; score: number } => r.score !== null)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.item);
}
