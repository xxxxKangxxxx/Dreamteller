function safeDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateDot(iso: string): string {
  const d = safeDate(iso);
  if (!d) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function formatDateKoShort(iso: string): string {
  const d = safeDate(iso);
  if (!d) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
