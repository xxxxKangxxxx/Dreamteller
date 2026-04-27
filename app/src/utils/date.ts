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

export function getGreeting(now: Date = new Date()): { label: string; emoji: string } {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return { label: '좋은 아침이에요', emoji: '☀️' };
  if (hour >= 12 && hour < 18) return { label: '좋은 오후예요', emoji: '🌤️' };
  if (hour >= 18 && hour < 22) return { label: '좋은 저녁이에요', emoji: '🌆' };
  return { label: '좋은 밤이에요', emoji: '🌙' };
}
