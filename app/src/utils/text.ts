/**
 * 한국어 본문을 문장 단위로 끊어 paragraph 배열로 반환한다.
 * 마침표/물음표/느낌표 뒤 공백을 기준으로 분리하고, 두 문장씩 묶어서 단락을 구성한다.
 *
 * 예) "비가 왔다. 나는 우산을 잃어버렸다. 그래도 괜찮았다."
 *  → ["비가 왔다. 나는 우산을 잃어버렸다.", "그래도 괜찮았다."]
 */
export function splitIntoParagraphs(text: string, sentencesPerParagraph = 2): string[] {
  const trimmed = text?.trim();
  if (!trimmed) return [];

  const sentences: string[] = [];
  const re = /[^.!?。！？]+[.!?。！？]+["'”’)]*\s*/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  while ((match = re.exec(trimmed)) !== null) {
    sentences.push(match[0].trim());
    lastIndex = match.index + match[0].length;
  }
  const tail = trimmed.slice(lastIndex).trim();
  if (tail) sentences.push(tail);

  if (sentences.length === 0) return [trimmed];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(' '));
  }
  return paragraphs;
}
