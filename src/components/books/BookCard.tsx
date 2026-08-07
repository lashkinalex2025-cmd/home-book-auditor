import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/solid';
import { memo } from 'react';
import type { Book } from '@/types/book';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/book';
import { BookCover } from './BookCover';
import { StarRating } from '@/components/ui/StarRating';

interface BookCardProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
}

export const BookCard = memo(function BookCard({ book, size = 'md' }: BookCardProps) {
  const coverSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <Link
      to={`/books/${book.id}`}
      className="card group flex gap-3 p-3 transition hover:-translate-y-0.5 hover:border-brand-300 dark:hover:border-brand-700"
    >
      <BookCover src={book.coverDataUrl} title={book.title} size={coverSize} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300">
            {book.title}
          </h3>
          {book.isFavorite && (
            <HeartIcon
              className="h-4 w-4 shrink-0 text-rose-500"
              aria-label="Избранное"
            />
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {book.author || 'Без автора'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[book.status]}`}
          >
            {STATUS_LABELS[book.status]}
          </span>
          {book.genre && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {book.genre}
            </span>
          )}
        </div>
        {book.rating > 0 && (
          <div className="mt-2">
            <StarRating value={book.rating} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
});
