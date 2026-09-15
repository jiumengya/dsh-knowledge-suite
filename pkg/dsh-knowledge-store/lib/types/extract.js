/**
 * Document-format detection and text extraction for the local knowledge
 * store. Plain text, Markdown, and HTML extract in-process; PDF and Word load
 * their parsers through dynamic import so the store starts without them and
 * pays the parse cost only per document of that format.
 * @module @deepseek-ai/dsh-knowledge-store/src/extract
 */
import { readFile } from 'node:fs/promises';
/** File extensions accepted during a directory scan, mapped to their format. */
const SCAN_EXTENSIONS = {
    '.txt': 'text',
    '.text': 'text',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.html': 'html',
    '.htm': 'html',
    '.xhtml': 'html',
    '.pdf': 'pdf',
    '.docx': 'docx',
};
/**
 * Detect a document format from the filename, restricted to the extensions a
 * directory scan accepts.
 * @param filename - candidate file name.
 * @returns the format, or `undefined` when the extension is not a scan-accepted document format.
 */
export function scanFormat(filename) {
    const dot = filename.lastIndexOf('.');
    if (dot < 0)
        return undefined;
    return SCAN_EXTENSIONS[filename.slice(dot).toLowerCase()];
}
/**
 * Resolve the format of one explicitly named file. Unlike {@link scanFormat},
 * an unknown or missing extension falls back to `text`: a file the caller
 * pointed at directly is ingested rather than skipped.
 * @param filename - explicitly named file.
 * @returns the format; never `undefined`.
 */
export function explicitFormat(filename) {
    return scanFormat(filename) ?? 'text';
}
/**
 * Extract the retrievable text of one document file.
 * @param path - absolute file path.
 * @param format - the document's format.
 * @returns the extracted text; whitespace is not normalized here — chunking owns that.
 * @throws when the file cannot be read or the parser rejects its contents.
 */
export async function extractDocumentText(path, format) {
    switch (format) {
        case 'text':
        case 'markdown':
            return await readFile(path, 'utf8');
        case 'html':
            return stripHtml(await readFile(path, 'utf8'));
        case 'pdf':
            return await extractPdfText(path);
        case 'docx':
            return await extractDocxText(path);
    }
}
/**
 * Extract PDF text through unpdf's serverless pdf.js build.
 * @param path - absolute PDF path.
 * @returns the text of every page concatenated in page order.
 */
async function extractPdfText(path) {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(await readFile(path)));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
}
/**
 * Extract DOCX text through mammoth.
 * @param path - absolute DOCX path.
 * @returns the document's raw text without formatting.
 */
async function extractDocxText(path) {
    const { default: mammoth } = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer: await readFile(path) });
    return value;
}
/** Block-level HTML tags whose close should start a new text line. */
const BLOCK_CLOSE = new RegExp('</(?:p|div|li|dd|dt|h[1-6]|tr|table|thead|tbody|ul|ol|dl|section|article|aside|header|footer|nav|blockquote|pre|figure|figcaption)>', 'gi');
/**
 * Reduce HTML to retrievable text: drop script/style blocks, convert block
 * closings and `<br>` to newlines, strip remaining tags, and decode common
 * entities. Lossy by design — the output feeds retrieval, not rendering.
 * @param html - raw HTML source.
 * @returns the visible text content.
 */
export function stripHtml(html) {
    return decodeEntities(html
        .replace(/<script[\s\S]*?<\/script\s*>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style\s*>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(BLOCK_CLOSE, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' '));
}
/** Named entities covering the characters that survive tag stripping. */
const NAMED_ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0',
    hellip: '…',
    mdash: '—',
    ndash: '–',
    lsquo: '\u2018',
    rsquo: '\u2019',
    ldquo: '\u201C',
    rdquo: '\u201D',
    middot: '·',
    copy: '©',
    reg: '®',
    trade: '™',
};
/**
 * Decode the HTML entities tag stripping leaves behind.
 * @param text - text possibly containing named or numeric entities.
 * @returns text with recognized entities replaced by their characters.
 */
function decodeEntities(text) {
    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
        if (body.startsWith('#')) {
            const codePoint = body.startsWith('#x') || body.startsWith('#X')
                ? Number.parseInt(body.slice(2), 16)
                : Number.parseInt(body.slice(1), 10);
            return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10FFFF
                ? String.fromCodePoint(codePoint)
                : match;
        }
        return NAMED_ENTITIES[body] ?? match;
    });
}
//# sourceMappingURL=extract.js.map