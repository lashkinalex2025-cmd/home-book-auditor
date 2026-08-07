import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Book } from '@/types/book';

export function useBooks(): Book[] {
  const books = useLiveQuery(() => db.books.orderBy('updatedAt').reverse().toArray(), []);
  return books ?? [];
}

export function useBook(id: number | undefined): Book | undefined {
  const book = useLiveQuery(
    () => (id != null && !Number.isNaN(id) ? db.books.get(id) : undefined),
    [id],
  );
  return book;
}
