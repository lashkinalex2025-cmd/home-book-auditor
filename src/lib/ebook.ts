import type { EbookFormat } from '@/types/book';

/** Максимальный размер файла электронной книги (50 МБ) */
export const MAX_EBOOK_SIZE = 50 * 1024 * 1024;

export const EBOOK_ACCEPT =
  '.epub,.pdf,.txt,.fb2,application/epub+zip,application/pdf,text/plain,application/x-fictionbook+xml';

const FORMAT_MIME: Record<EbookFormat, string> = {
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  txt: 'text/plain',
  fb2: 'application/x-fictionbook+xml',
};

export function detectEbookFormat(file: File): EbookFormat | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.epub')) return 'epub';
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.fb2')) return 'fb2';

  const type = (file.type || '').toLowerCase();
  if (type.includes('epub')) return 'epub';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/plain')) return 'txt';
  if (type.includes('fictionbook') || type.includes('fb2')) return 'fb2';
  return null;
}

export function mimeForFormat(format: EbookFormat): string {
  return FORMAT_MIME[format];
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function validateEbookFile(file: File):
  | {
      ok: true;
      format: EbookFormat;
      mimeType: string;
    }
  | { ok: false; error: string } {
  if (file.size <= 0) {
    return { ok: false, error: 'Файл пуст' };
  }
  if (file.size > MAX_EBOOK_SIZE) {
    return {
      ok: false,
      error: `Файл слишком большой (макс. ${formatFileSize(MAX_EBOOK_SIZE)})`,
    };
  }
  const format = detectEbookFormat(file);
  if (!format) {
    return {
      ok: false,
      error: 'Поддерживаются форматы: EPUB, PDF, TXT, FB2',
    };
  }
  return {
    ok: true,
    format,
    mimeType: file.type || mimeForFormat(format),
  };
}

/** Декодирование текста с fallback кодировок (UTF-8 → windows-1251) */
export async function readTextFromBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    if (!utf8.includes('\uFFFD')) return utf8;
  } catch {
    /* try next */
  }
  try {
    return new TextDecoder('windows-1251').decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

/** Простой разбор FB2 → плоский текст */
export async function parseFb2ToText(blob: Blob): Promise<string> {
  const xml = await readTextFromBlob(blob);
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    // fallback: strip tags roughly
    return xml
      .replace(/<\?xml[\s\S]*?\?>/i, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const title =
    doc.querySelector('book-title')?.textContent?.trim() ||
    doc.querySelector('title-info book-title')?.textContent?.trim() ||
    '';

  const bodies = Array.from(doc.querySelectorAll('body'));
  const parts: string[] = [];
  if (title) parts.push(title);

  for (const body of bodies) {
    const name = body.getAttribute('name');
    if (name && /notes|comments/i.test(name)) continue;
    const paragraphs = body.querySelectorAll('p, v, subtitle, text-author, title');
    if (paragraphs.length) {
      for (const p of paragraphs) {
        const t = (p.textContent || '').replace(/\s+/g, ' ').trim();
        if (t) parts.push(t);
      }
    } else {
      const t = (body.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) parts.push(t);
    }
  }

  return parts.join('\n\n').trim() || 'Не удалось извлечь текст из FB2';
}

export function hasEbook(book: {
  ebookFileName?: string | null;
  ebookFormat?: string | null;
}): boolean {
  return Boolean(book.ebookFileName && book.ebookFormat);
}
