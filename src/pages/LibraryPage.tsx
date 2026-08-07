import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useBooks } from '@/hooks/useBooks';
import { VirtualBookList } from '@/components/books/VirtualBookList';
import { EmptyState } from '@/components/ui/EmptyState';
import { collectFacets, filterAndSortBooks } from '@/lib/filterBooks';
import type { BookFilters, BookStatus, SortField } from '@/types/book';
import { BOOK_STATUSES, STATUS_LABELS } from '@/types/book';

export function LibraryPage() {
  const books = useBooks();
  const [params] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<BookFilters>({
    query: '',
    status: 'all',
    genre: '',
    author: '',
    tag: '',
    series: '',
    favoritesOnly: params.get('favorites') === '1',
    sortBy: 'updatedAt',
    sortDir: 'desc',
  });

  const facets = useMemo(() => collectFacets(books), [books]);
  const filtered = useMemo(
    () => filterAndSortBooks(books, filters),
    [books, filters],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Моя библиотека</h1>
          <p className="page-subtitle">
            {filtered.length} из {books.length} книг
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowFilters((v) => !v)}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          <Link to="/books/new" className="btn-primary">
            <PlusIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <input
        className="input"
        placeholder="Быстрый поиск…"
        value={filters.query}
        onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
      />

      {showFilters && (
        <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Статус</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as BookStatus | 'all',
                }))
              }
            >
              <option value="all">Все</option>
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Жанр</label>
            <select
              className="input"
              value={filters.genre}
              onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
            >
              <option value="">Все</option>
              {facets.genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Автор</label>
            <select
              className="input"
              value={filters.author}
              onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value }))}
            >
              <option value="">Все</option>
              {facets.authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Серия</label>
            <select
              className="input"
              value={filters.series}
              onChange={(e) => setFilters((f) => ({ ...f, series: e.target.value }))}
            >
              <option value="">Все</option>
              {facets.series.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Тег</label>
            <select
              className="input"
              value={filters.tag}
              onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
            >
              <option value="">Все</option>
              {facets.tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Сортировка</label>
            <div className="flex gap-2">
              <select
                className="input"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sortBy: e.target.value as SortField }))
                }
              >
                <option value="updatedAt">Изменения</option>
                <option value="createdAt">Дата добавления</option>
                <option value="title">Название</option>
                <option value="author">Автор</option>
                <option value="year">Год</option>
                <option value="rating">Рейтинг</option>
                <option value="price">Цена</option>
                <option value="pages">Страницы</option>
                <option value="status">Статус</option>
              </select>
              <select
                className="input w-28"
                value={filters.sortDir}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    sortDir: e.target.value as 'asc' | 'desc',
                  }))
                }
              >
                <option value="asc">↑</option>
                <option value="desc">↓</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium sm:col-span-2 lg:col-span-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={filters.favoritesOnly}
              onChange={(e) =>
                setFilters((f) => ({ ...f, favoritesOnly: e.target.checked }))
              }
            />
            Только избранное
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={books.length ? 'Ничего не найдено' : 'Пока нет книг'}
          description={
            books.length
              ? 'Измените фильтры или поисковый запрос'
              : 'Добавьте первую книгу в библиотеку'
          }
          action={
            !books.length ? (
              <Link to="/books/new" className="btn-primary">
                <PlusIcon className="h-5 w-5" />
                Добавить
              </Link>
            ) : undefined
          }
        />
      ) : (
        <VirtualBookList books={filtered} />
      )}
    </div>
  );
}
