import { describe, expect, it } from 'vitest';
import { bookSchema, sanitizeBookImport } from './validation';

describe('bookSchema', () => {
  it('accepts a minimal valid book', () => {
    const parsed = bookSchema.safeParse({
      title: 'Тест',
      author: '',
      series: '',
      volume: '',
      genre: '',
      isbn: '',
      publisher: '',
      year: null,
      language: 'ru',
      pages: null,
      purchaseDate: '',
      price: null,
      location: '',
      status: 'owned',
      rating: 0,
      notes: '',
      tags: [],
      coverDataUrl: null,
      isFavorite: false,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty title', () => {
    const parsed = bookSchema.safeParse({
      title: '   ',
      author: '',
      series: '',
      volume: '',
      genre: '',
      isbn: '',
      publisher: '',
      year: null,
      language: 'ru',
      pages: null,
      purchaseDate: '',
      price: null,
      location: '',
      status: 'owned',
      rating: 0,
      notes: '',
      tags: [],
      coverDataUrl: null,
      isFavorite: false,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('sanitizeBookImport', () => {
  it('imports valid payload', () => {
    const book = sanitizeBookImport({
      title: 'Война и мир',
      author: 'Толстой',
      status: 'read',
      tags: 'эпос; классика',
      year: '1869',
      pages: '1200',
      price: '500,5',
      rating: '5',
    });
    expect(book).not.toBeNull();
    expect(book?.title).toBe('Война и мир');
    expect(book?.year).toBe(1869);
    expect(book?.tags).toEqual(['эпос', 'классика']);
  });

  it('skips broken payload', () => {
    expect(sanitizeBookImport(null)).toBeNull();
    expect(sanitizeBookImport({ title: '' })).toBeNull();
    expect(sanitizeBookImport({ title: 'X', status: 'nope' })).toBeNull();
  });

  it('drops non-image covers and NaN numbers', () => {
    const book = sanitizeBookImport({
      title: 'Ok',
      coverDataUrl: 'javascript:alert(1)',
      year: 'not-a-year',
      pages: 'abc',
      price: 'xyz',
    });
    expect(book).not.toBeNull();
    expect(book?.coverDataUrl).toBeNull();
    expect(book?.year).toBeNull();
    expect(book?.pages).toBeNull();
    expect(book?.price).toBeNull();
  });
});
