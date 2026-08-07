import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Book } from '@/types/book';

export function useBooks(): Book[] {
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray(), []);
  return books ?? [];
}

/** undefined = loading, null = not found, Book = found */
export function useBook(id: number | undefined): Book | null | undefined {
  return useLiveQuery(async () => {
    if (id == null || Number.isNaN(id)) return null;
    const book = await db.books.get(id);
    return book ?? null;
  }, [id]);
}
