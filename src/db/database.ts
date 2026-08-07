import Dexie, { type Table } from 'dexie';
import type { AppSettings, Book } from '@/types/book';
import { DEFAULT_SETTINGS } from '@/types/book';

export class BookAuditorDB extends Dexie {
  books!: Table<Book, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('HomeBookAuditor');
    this.version(1).stores({
      books:
        '++id, title, author, genre, isbn, series, status, isFavorite, createdAt, updatedAt, *tags',
      settings: 'id',
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
    ...book,
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
  await db.books.delete(id);
}

export async function clearAllBooks(): Promise<void> {
  await db.books.clear();
}

export async function replaceAllBooks(books: Book[]): Promise<void> {
  await db.transaction('rw', db.books, async () => {
    await db.books.clear();
    if (books.length) {
      const cleaned = books.map(({ id: _id, ...rest }) => rest);
      await db.books.bulkAdd(cleaned as Book[]);
    }
  });
}
