import type { Book, BookFilters } from '@/types/book';

export function filterAndSortBooks(books: Book[], filters: BookFilters): Book[] {
  const q = filters.query.trim().toLowerCase();

  let result = books.filter((b) => {
    if (filters.status !== 'all' && b.status !== filters.status) return false;
    if (filters.favoritesOnly && !b.isFavorite) return false;
    if (filters.genre && b.genre !== filters.genre) return false;
    if (filters.author && b.author !== filters.author) return false;
    if (filters.series && b.series !== filters.series) return false;
    if (filters.tag && !b.tags.includes(filters.tag)) return false;

    if (!q) return true;

    const haystack = [
      b.title,
      b.author,
      b.isbn,
      b.genre,
      b.series,
      b.publisher,
      b.location,
      b.notes,
      ...b.tags,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  const dir = filters.sortDir === 'asc' ? 1 : -1;
  const field = filters.sortBy;

  result = [...result].sort((a, b) => {
    const av = a[field];
    const bv = b[field];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }

    return String(av).localeCompare(String(bv), 'ru', { sensitivity: 'base' }) * dir;
  });

  return result;
}

export function collectFacets(books: Book[]) {
  const genres = new Set<string>();
  const authors = new Set<string>();
  const tags = new Set<string>();
  const series = new Set<string>();

  for (const b of books) {
    if (b.genre) genres.add(b.genre);
    if (b.author) authors.add(b.author);
    if (b.series) series.add(b.series);
    for (const t of b.tags) tags.add(t);
  }

  const sortRu = (a: string, b: string) =>
    a.localeCompare(b, 'ru', { sensitivity: 'base' });

  return {
    genres: [...genres].sort(sortRu),
    authors: [...authors].sort(sortRu),
    tags: [...tags].sort(sortRu),
    series: [...series].sort(sortRu),
  };
}
