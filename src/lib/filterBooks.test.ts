import { describe, expect, it } from 'vitest';
import { filterAndSortBooks } from './filterBooks';
import type { Book, BookFilters } from '@/types/book';

const base: Book = {
  id: 1,
  title: 'Война и мир',
  author: 'Толстой',
  series: '',
  volume: '',
  genre: 'Классика',
  isbn: '978123',
  publisher: '',
  year: 1869,
  language: 'ru',
  pages: 1000,
  purchaseDate: '',
  price: 500,
  location: '',
  status: 'read',
  rating: 5,
  notes: '',
  tags: ['эпос'],
  coverDataUrl: null,
  isFavorite: true,
  ebookFileName: null,
  ebookFormat: null,
  ebookSize: null,
  ebookProgress: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

const books: Book[] = [
  base,
  {
    ...base,
    id: 2,
    title: '1984',
    author: 'Оруэлл',
    genre: 'Антиутопия',
    isbn: '978456',
    status: 'owned',
    isFavorite: false,
    tags: ['дистопия'],
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-05-01T00:00:00.000Z',
  },
];

const defaultFilters: BookFilters = {
  query: '',
  status: 'all',
  genre: '',
  author: '',
  tag: '',
  series: '',
  favoritesOnly: false,
  sortBy: 'title',
  sortDir: 'asc',
};

describe('filterAndSortBooks', () => {
  it('filters by query', () => {
    const result = filterAndSortBooks(books, { ...defaultFilters, query: 'толст' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Война и мир');
  });

  it('filters favorites', () => {
    const result = filterAndSortBooks(books, {
      ...defaultFilters,
      favoritesOnly: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('sorts by title', () => {
    const result = filterAndSortBooks(books, {
      ...defaultFilters,
      sortBy: 'title',
      sortDir: 'asc',
    });
    expect(result[0].title).toBe('1984');
  });
});
