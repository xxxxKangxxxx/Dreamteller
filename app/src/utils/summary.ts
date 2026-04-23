import type { ChatMessage } from '@/types/dream';

export function draftSummaryFromChat(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((text) => text.length > 0)
    .join('\n\n');
}
