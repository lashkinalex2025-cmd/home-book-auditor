import Dexie, { type Table } from 'dexie';
import type { AppSettings, Book, EbookBlobRecord, EbookFormat } from '@/types/book';
import { DEFAULT_SETTINGS } from '@/types/book';

function withEbookDefaults(
  book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> | Book,
): Omit<Book, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...book,
    ebookFileName: book.ebookFileName ?? null,
    ebookFormat: book.ebookFormat ?? null,
    ebookSize: book.ebookSize ?? null,
    ebookProgress: book.ebookProgress ?? null,
  };
}

export class BookAuditorDB extends Dexie {
  books!: Table<Book, number>;
  settings!: Table<AppSettings, number>;
  ebooks!: Table<EbookBlobRecord, number>;

  constructor() {
    super('HomeBookAuditor');
    this.version(1).stores({
      books:
        '++id, title, author, genre, isbn, series, status, isFavorite, createdAt, updatedAt, *tags',
      settings: 'id',
    });
    this.version(2)
      .stores({
        books:
          '++id, title, author, genre, isbn, series, status, isFavorite, createdAt, updatedAt, ebookFormat, *tags',
        settings: 'id',
        ebooks: 'bookId, format, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('books')
          .toCollection()
          .modify((book: Book) => {
            if (book.ebookFileName === undefined) book.ebookFileName = null;
            if (book.ebookFormat === undefined) book.ebookFormat = null;
            if (book.ebookSize === undefined) book.ebookSize = null;
            if (book.ebookProgress === undefined) book.ebookProgress = null;
          });
      });
  }
}

export const db = new BookAuditorDB();

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(1);
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function getSettings(): Promise<AppSettings> {
  return ensureSettings();
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, 'id'>>,
): Promise<AppSettings> {
  const current = await ensureSettings();
  const next = { ...current, ...patch, id: 1 as const };
  await db.settings.put(next);
  return next;
}

export async function addBook(
  book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.books.add({
    ...withEbookDefaults(book),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateBook(
  id: number,
  patch: Partial<Omit<Book, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.books.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBook(id: number): Promise<void> {
  await db.transaction('rw', db.books, db.ebooks, async () => {
    await db.ebooks.delete(id);
    await db.books.delete(id);
  });
}

export async function clearAllBooks(): Promise<void> {
  await db.transaction('rw', db.books, db.ebooks, async () => {
    await db.ebooks.clear();
    await db.books.clear();
  });
}

export async function replaceAllBooks(books: Book[]): Promise<void> {
  await db.transaction('rw', db.books, db.ebooks, async () => {
    await db.ebooks.clear();
    await db.books.clear();
    if (books.length) {
      const cleaned = books.map(({ id: _id, ...rest }) => ({
        ...withEbookDefaults(rest),
        // файлы e-book не входят в JSON/CSV импорт
        ebookFileName: null,
        ebookFormat: null,
        ebookSize: null,
        ebookProgress: null,
      }));
      await db.books.bulkAdd(cleaned as Book[]);
    }
  });
}

export async function saveEbookFile(
  bookId: number,
  file: File,
  format: EbookFormat,
  mimeType: string,
): Promise<void> {
  const now = new Date().toISOString();
  const blob = file.slice(
    0,
    file.size,
    mimeType || file.type || 'application/octet-stream',
  );
  await db.transaction('rw', db.books, db.ebooks, async () => {
    await db.ebooks.put({
      bookId,
      data: blob,
      fileName: file.name,
      mimeType: mimeType || file.type || 'application/octet-stream',
      format,
      size: file.size,
      updatedAt: now,
    });
    await db.books.update(bookId, {
      ebookFileName: file.name,
      ebookFormat: format,
      ebookSize: file.size,
      ebookProgress: null,
      updatedAt: now,
    });
  });
}

export async function getEbookFile(bookId: number): Promise<EbookBlobRecord | undefined> {
  return db.ebooks.get(bookId);
}

export async function removeEbookFile(bookId: number): Promise<void> {
  await db.transaction('rw', db.books, db.ebooks, async () => {
    await db.ebooks.delete(bookId);
    await db.books.update(bookId, {
      ebookFileName: null,
      ebookFormat: null,
      ebookSize: null,
      ebookProgress: null,
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function saveEbookProgress(bookId: number, progress: string): Promise<void> {
  await db.books.update(bookId, {
    ebookProgress: progress,
    updatedAt: new Date().toISOString(),
  });
}
