import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useBooks } from '@/hooks/useBooks';
import { filterAndSortBooks } from '@/lib/filterBooks';
import { VirtualBookList } from '@/components/books/VirtualBookList';
import { EmptyState } from '@/components/ui/EmptyState';
import type { BookFilters } from '@/types/book';

export function SearchPage() {
  const books = useBooks();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const filters: BookFilters = {
      query,
      status: 'all',
      genre: '',
      author: '',
      tag: '',
      series: '',
      favoritesOnly: false,
      sortBy: 'title',
      sortDir: 'asc',
    };
    return filterAndSortBooks(books, filters);
  }, [books, query]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="page-title">Поиск</h1>
        <p className="page-subtitle">По названию, автору, ISBN, жанру, тегам и серии</p>
      </header>

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-11"
          autoFocus
          placeholder="Начните вводить…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query.trim() ? (
        <EmptyState
          title="Введите запрос"
          description="Например: Толстой, 978, фантастика, полка А"
          icon={<MagnifyingGlassIcon className="h-7 w-7" />}
        />
      ) : results.length === 0 ? (
        <EmptyState title="Ничего не найдено" description="Попробуйте другой запрос" />
      ) : (
        <>
          <p className="text-sm text-slate-500">Найдено: {results.length}</p>
          <VirtualBookList books={results} />
        </>
      )}
    </div>
  );
}
