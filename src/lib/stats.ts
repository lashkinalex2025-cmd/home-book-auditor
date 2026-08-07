import type { Book } from '@/types/book';

export interface LibraryStats {
  total: number;
  read: number;
  unread: number;
  reading: number;
  favorites: number;
  totalPages: number;
  totalValue: number;
  byGenre: { label: string; value: number }[];
  byAuthor: { label: string; value: number }[];
  byStatus: { label: string; value: number }[];
  byMonth: { label: string; value: number }[];
}

export function computeStats(books: Book[]): LibraryStats {
  const byGenre = new Map<string, number>();
  const byAuthor = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byMonth = new Map<string, number>();

  let read = 0;
  let reading = 0;
  let favorites = 0;
  let totalPages = 0;
  let totalValue = 0;

  for (const b of books) {
    if (b.status === 'read') read += 1;
    if (b.status === 'reading') reading += 1;
    if (b.isFavorite) favorites += 1;
    if (b.pages) totalPages += b.pages;
    if (b.price) totalValue += b.price;

    const genre = b.genre || 'Без жанра';
    byGenre.set(genre, (byGenre.get(genre) ?? 0) + 1);

    const author = b.author || 'Без автора';
    byAuthor.set(author, (byAuthor.get(author) ?? 0) + 1);

    byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);

    const month = (b.createdAt || '').slice(0, 7) || 'unknown';
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }

  const top = (map: Map<string, number>, limit = 8) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value]) => ({ label, value }));

  const months = [...byMonth.entries()]
    .filter(([k]) => k !== 'unknown')
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([label, value]) => ({ label, value }));

  return {
    total: books.length,
    read,
    unread: books.length - read,
    reading,
    favorites,
    totalPages,
    totalValue,
    byGenre: top(byGenre),
    byAuthor: top(byAuthor),
    byStatus: top(byStatus, 10),
    byMonth: months,
  };
}
