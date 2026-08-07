import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Book } from '@/types/book';
import { BookCard } from './BookCard';
import { useSettings } from '@/context/SettingsContext';

interface VirtualBookListProps {
  books: Book[];
}

export function VirtualBookList({ books }: VirtualBookListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const rowHeight =
    settings.cardSize === 'lg' ? 168 : settings.cardSize === 'sm' ? 112 : 140;

  const virtualizer = useVirtualizer({
    count: books.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  });

  // For small lists use simple grid (better on desktop)
  if (books.length <= 40) {
    return (
      <div
        className={`grid gap-3 ${
          settings.cardSize === 'lg'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {books.map((book) => (
          <BookCard key={book.id} book={book} size={settings.cardSize} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[min(70vh,720px)] overflow-auto rounded-3xl border border-slate-200/60 dark:border-slate-800"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const book = books[item.index];
          return (
            <div
              key={book.id ?? item.key}
              className="absolute left-0 top-0 w-full px-1 py-1.5"
              style={{
                height: `${item.size}px`,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <BookCard book={book} size={settings.cardSize} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
