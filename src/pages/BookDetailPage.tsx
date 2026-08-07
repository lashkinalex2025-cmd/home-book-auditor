import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  HeartIcon,
  PencilSquareIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useBook } from '@/hooks/useBooks';
import { BookCover } from '@/components/books/BookCover';
import { StarRating } from '@/components/ui/StarRating';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/book';
import { deleteBook, updateBook } from '@/db/database';
import { useToast } from '@/components/ui/Toast';
import { useSettings } from '@/context/SettingsContext';

export function BookDetailPage() {
  const { id } = useParams();
  const bookId = Number(id);
  const book = useBook(bookId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();

  if (book === undefined) {
    return <p className="page-subtitle">Загрузка…</p>;
  }

  if (!book) {
    return (
      <div className="space-y-4">
        <p className="text-rose-500">Книга не найдена</p>
        <Link to="/library" className="btn-primary">
          В библиотеку
        </Link>
      </div>
    );
  }

  async function toggleFavorite() {
    await updateBook(bookId, { isFavorite: !book!.isFavorite });
  }

  async function handleDelete() {
    if (!confirm(`Удалить «${book!.title}»?`)) return;
    await deleteBook(bookId);
    toast('Книга удалена', 'success');
    navigate('/library', { replace: true });
  }

  async function handleShare() {
    const text = [
      book!.title,
      book!.author && `Автор: ${book!.author}`,
      book!.isbn && `ISBN: ${book!.isbn}`,
      STATUS_LABELS[book!.status],
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: book!.title, text });
        return;
      } catch {
        /* cancelled */
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast('Скопировано в буфер обмена', 'success');
    } catch {
      toast('Не удалось поделиться', 'error');
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Автор', value: book.author || '—' },
    { label: 'Серия', value: book.series || '—' },
    { label: 'Том', value: book.volume || '—' },
    { label: 'Жанр', value: book.genre || '—' },
    { label: 'ISBN', value: book.isbn || '—' },
    { label: 'Издательство', value: book.publisher || '—' },
    { label: 'Год', value: book.year != null ? String(book.year) : '—' },
    { label: 'Язык', value: book.language || '—' },
    { label: 'Страниц', value: book.pages != null ? String(book.pages) : '—' },
    { label: 'Дата покупки', value: book.purchaseDate || '—' },
    {
      label: 'Стоимость',
      value:
        book.price != null
          ? `${book.price.toLocaleString('ru-RU')} ${settings.currency}`
          : '—',
    },
    { label: 'Место хранения', value: book.location || '—' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-2">
        <button type="button" className="btn-ghost p-2" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex gap-1">
          <button type="button" className="btn-ghost p-2" onClick={() => void handleShare()}>
            <ShareIcon className="h-5 w-5" />
          </button>
          <button type="button" className="btn-ghost p-2" onClick={() => void toggleFavorite()}>
            {book.isFavorite ? (
              <HeartSolid className="h-5 w-5 text-rose-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          <Link to={`/books/${book.id}/edit`} className="btn-ghost p-2">
            <PencilSquareIcon className="h-5 w-5" />
          </Link>
          <button type="button" className="btn-ghost p-2 text-rose-500" onClick={() => void handleDelete()}>
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">
        <BookCover src={book.coverDataUrl} title={book.title} size="lg" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-slate-500">{book.author || 'Без автора'}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[book.status]}`}
            >
              {STATUS_LABELS[book.status]}
            </span>
            <StarRating
              value={book.rating}
              onChange={(rating) => void updateBook(bookId, { rating })}
            />
          </div>
          {book.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {book.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card divide-y divide-slate-100 p-2 dark:divide-slate-800">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-4 px-3 py-2.5 text-sm"
          >
            <span className="text-slate-500">{r.label}</span>
            <span className="text-right font-medium">{r.value}</span>
          </div>
        ))}
      </div>

      {book.notes && (
        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Заметки
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{book.notes}</p>
        </div>
      )}
    </div>
  );
}
