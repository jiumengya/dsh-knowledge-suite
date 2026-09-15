/**
 * Paragraph-aware text chunking for the local knowledge store: whole
 * paragraphs accumulate up to the configured size, oversized paragraphs split
 * on sentence boundaries, and unbreakable runs split by character.
 * @module @deepseek-ai/dsh-knowledge-store/src/chunk
 */
/** Sentence enders shared by Latin and CJK prose; sentence splits stay inside one paragraph. */
const SENTENCE_SPLIT = /(?<=[.!?。！？；;])\s*/;
/**
 * Split extracted text into retrieval chunks.
 * @param text - extracted document text.
 * @param chunkSize - maximum characters per chunk; paragraphs never merge past it.
 * @returns one or more non-empty chunks in reading order; `[]` when the text has no non-whitespace content.
 */
export function chunkText(text, chunkSize) {
    const chunks = [];
    let pending = [];
    let pendingLength = 0;
    const flush = () => {
        if (pending.length > 0) {
            chunks.push(pending.join('\n\n'));
            pending = [];
            pendingLength = 0;
        }
    };
    for (const raw of text.split(/\n\s*\n/)) {
        const paragraph = raw.trim();
        if (paragraph.length === 0)
            continue;
        if (paragraph.length > chunkSize) {
            flush();
            chunks.push(...splitLongParagraph(paragraph, chunkSize));
            continue;
        }
        if (pendingLength > 0 && pendingLength + 2 + paragraph.length > chunkSize)
            flush();
        pending.push(paragraph);
        pendingLength = pending.join('\n\n').length;
    }
    flush();
    return chunks;
}
/**
 * Split one paragraph that alone exceeds the chunk size: sentence
 * boundaries first, then whitespace-separated words, then characters for an
 * unbreakable run.
 * @param paragraph - the oversized paragraph.
 * @param chunkSize - maximum characters per chunk.
 * @returns the paragraph's text in chunk-sized pieces.
 */
function splitLongParagraph(paragraph, chunkSize) {
    const parts = [];
    let pending = '';
    for (const sentence of paragraph.split(SENTENCE_SPLIT)) {
        if (sentence.length === 0)
            continue;
        if (sentence.length > chunkSize) {
            if (pending.length > 0) {
                parts.push(pending);
                pending = '';
            }
            parts.push(...splitLongRun(sentence, chunkSize));
            continue;
        }
        if (pending.length > 0 && pending.length + sentence.length > chunkSize) {
            parts.push(pending);
            pending = '';
        }
        pending += sentence;
    }
    if (pending.length > 0)
        parts.push(pending);
    return parts;
}
/**
 * Split one oversized sentence on word boundaries, hard-splitting only a word
 * that alone exceeds the chunk size.
 * @param sentence - the oversized sentence.
 * @param chunkSize - maximum characters per chunk.
 * @returns the sentence's text in chunk-sized pieces.
 */
function splitLongRun(sentence, chunkSize) {
    const parts = [];
    let pending = '';
    for (const word of sentence.split(' ')) {
        if (word.length > chunkSize) {
            if (pending.length > 0) {
                parts.push(pending);
                pending = '';
            }
            for (let start = 0; start < word.length; start += chunkSize) {
                parts.push(word.slice(start, start + chunkSize));
            }
            continue;
        }
        const joined = pending.length === 0 ? word : `${pending} ${word}`;
        if (joined.length > chunkSize) {
            parts.push(pending);
            pending = word;
        }
        else {
            pending = joined;
        }
    }
    if (pending.length > 0)
        parts.push(pending);
    return parts;
}
//# sourceMappingURL=chunk.js.map