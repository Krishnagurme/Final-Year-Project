const normalizeText = text => text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();

const estimateTokens = text => Math.ceil((text || '').length / 4);

export const chunkText = (rawText, options = {}) => {
  const chunkSize = options.chunkSize || 900;
  const chunkOverlap = options.chunkOverlap || 180;
  const text = normalizeText(rawText || '');

  if (!text) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      const sentenceBreak = text.lastIndexOf('. ', end);
      const boundary = Math.max(paragraphBreak, sentenceBreak);
      if (boundary > start + Math.floor(chunkSize * 0.5)) {
        end = boundary + 1;
      }
    }

    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        text: content,
        charStart: start,
        charEnd: end,
        tokenEstimate: estimateTokens(content),
      });
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - chunkOverlap, 0);
  }

  return chunks;
};

export { estimateTokens };
