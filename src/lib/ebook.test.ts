import { describe, expect, it } from 'vitest';
import { detectEbookFormat, formatFileSize, hasEbook, validateEbookFile } from './ebook';

function fakeFile(name: string, size = 1024, type = ''): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('detectEbookFormat', () => {
  it('detects by extension', () => {
    expect(detectEbookFormat(fakeFile('book.epub'))).toBe('epub');
    expect(detectEbookFormat(fakeFile('doc.PDF'))).toBe('pdf');
    expect(detectEbookFormat(fakeFile('notes.txt'))).toBe('txt');
    expect(detectEbookFormat(fakeFile('novel.fb2'))).toBe('fb2');
  });

  it('rejects unknown', () => {
    expect(detectEbookFormat(fakeFile('photo.jpg'))).toBeNull();
  });
});

describe('validateEbookFile', () => {
  it('accepts valid txt', () => {
    const r = validateEbookFile(fakeFile('a.txt', 100, 'text/plain'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.format).toBe('txt');
  });

  it('rejects empty and oversized', () => {
    expect(validateEbookFile(fakeFile('a.txt', 0)).ok).toBe(false);
    expect(validateEbookFile(fakeFile('a.txt', 60 * 1024 * 1024)).ok).toBe(false);
  });
});

describe('formatFileSize / hasEbook', () => {
  it('formats sizes', () => {
    expect(formatFileSize(500)).toContain('Б');
    expect(formatFileSize(2048)).toContain('КБ');
  });

  it('detects attached ebook', () => {
    expect(hasEbook({ ebookFileName: 'a.epub', ebookFormat: 'epub' })).toBe(true);
    expect(hasEbook({ ebookFileName: null, ebookFormat: null })).toBe(false);
  });
});
