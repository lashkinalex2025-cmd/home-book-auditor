import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { bookSchema, type BookFormValues } from '@/lib/validation';
import { compressImageFile } from '@/lib/image';
import { BOOK_STATUSES, EMPTY_BOOK, STATUS_LABELS, type Book } from '@/types/book';
import { StarRating } from '@/components/ui/StarRating';
import { BookCover } from './BookCover';
import { IsbnScanner } from './IsbnScanner';
import { useToast } from '@/components/ui/Toast';

interface BookFormProps {
  initial?: Book;
  onSubmit: (values: BookFormValues) => Promise<void>;
  submitLabel?: string;
}

export function BookForm({
  initial,
  onSubmit,
  submitLabel = 'Сохранить',
}: BookFormProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookSchema) as any,
    defaultValues: initial
      ? {
          title: initial.title,
          author: initial.author,
          series: initial.series,
          volume: initial.volume,
          genre: initial.genre,
          isbn: initial.isbn,
          publisher: initial.publisher,
          year: initial.year,
          language: initial.language,
          pages: initial.pages,
          purchaseDate: initial.purchaseDate,
          price: initial.price,
          location: initial.location,
          status: initial.status,
          rating: initial.rating,
          notes: initial.notes,
          tags: initial.tags,
          coverDataUrl: initial.coverDataUrl,
          isFavorite: initial.isFavorite,
        }
      : {
          title: EMPTY_BOOK.title,
          author: EMPTY_BOOK.author,
          series: EMPTY_BOOK.series,
          volume: EMPTY_BOOK.volume,
          genre: EMPTY_BOOK.genre,
          isbn: EMPTY_BOOK.isbn,
          publisher: EMPTY_BOOK.publisher,
          year: EMPTY_BOOK.year,
          language: EMPTY_BOOK.language,
          pages: EMPTY_BOOK.pages,
          purchaseDate: EMPTY_BOOK.purchaseDate,
          price: EMPTY_BOOK.price,
          location: EMPTY_BOOK.location,
          status: EMPTY_BOOK.status,
          rating: EMPTY_BOOK.rating,
          notes: EMPTY_BOOK.notes,
          tags: EMPTY_BOOK.tags,
          coverDataUrl: EMPTY_BOOK.coverDataUrl,
          isFavorite: EMPTY_BOOK.isFavorite,
        },
  });

  const cover = watch('coverDataUrl');
  const tags = watch('tags');
  const title = watch('title');

  useEffect(() => {
    if (initial?.id == null) return;
  }, [initial?.id]);

  async function handleImage(file: File | undefined) {
    if (!file) return;
    try {
      setBusy(true);
      const dataUrl = await compressImageFile(file);
      setValue('coverDataUrl', dataUrl, { shouldDirty: true });
      toast('Обложка обновлена', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка загрузки изображения', 'error');
    } finally {
      setBusy(false);
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 30) {
      toast('Максимум 30 тегов', 'error');
      return;
    }
    setValue('tags', [...tags, t], { shouldDirty: true });
    setTagInput('');
  }

  async function submit(values: BookFormValues) {
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div className="card flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <BookCover src={cover} title={title || 'Обложка'} size="lg" />
          <div className="flex w-full flex-col gap-2 sm:flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Обложка книги
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <PhotoIcon className="h-5 w-5" />
                Загрузить
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => cameraRef.current?.click()}
                disabled={busy}
              >
                <CameraIcon className="h-5 w-5" />
                Камера
              </button>
              {cover && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setValue('coverDataUrl', null, { shouldDirty: true })}
                >
                  <XMarkIcon className="h-5 w-5" />
                  Убрать
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Изображение автоматически сжимается до 800px
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleImage(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void handleImage(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="title">
              Название *
            </label>
            <input id="title" className="input" {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="author">
                Автор
              </label>
              <input id="author" className="input" {...register('author')} />
            </div>
            <div>
              <label className="label" htmlFor="genre">
                Жанр
              </label>
              <input id="genre" className="input" {...register('genre')} />
            </div>
            <div>
              <label className="label" htmlFor="series">
                Серия
              </label>
              <input id="series" className="input" {...register('series')} />
            </div>
            <div>
              <label className="label" htmlFor="volume">
                Том
              </label>
              <input id="volume" className="input" {...register('volume')} />
            </div>
            <div>
              <label className="label" htmlFor="isbn">
                ISBN
              </label>
              <div className="flex gap-2">
                <input id="isbn" className="input" {...register('isbn')} />
                <button
                  type="button"
                  className="btn-secondary shrink-0 px-3"
                  onClick={() => setShowScanner(true)}
                  title="Сканировать ISBN"
                >
                  <QrCodeIcon className="h-5 w-5" />
                </button>
              </div>
              {errors.isbn && (
                <p className="mt-1 text-xs text-rose-500">{errors.isbn.message}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="publisher">
                Издательство
              </label>
              <input id="publisher" className="input" {...register('publisher')} />
            </div>
            <div>
              <label className="label" htmlFor="year">
                Год
              </label>
              <input
                id="year"
                type="number"
                className="input"
                {...register('year', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="label" htmlFor="language">
                Язык
              </label>
              <select id="language" className="input" {...register('language')}>
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="other">Другой</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pages">
                Страниц
              </label>
              <input
                id="pages"
                type="number"
                className="input"
                {...register('pages', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="label" htmlFor="purchaseDate">
                Дата покупки
              </label>
              <input
                id="purchaseDate"
                type="date"
                className="input"
                {...register('purchaseDate')}
              />
            </div>
            <div>
              <label className="label" htmlFor="price">
                Стоимость
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                className="input"
                {...register('price', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>
            <div>
              <label className="label" htmlFor="location">
                Место хранения
              </label>
              <input id="location" className="input" {...register('location')} />
            </div>
            <div>
              <label className="label" htmlFor="status">
                Статус
              </label>
              <select id="status" className="input" {...register('status')}>
                {BOOK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Рейтинг</label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <StarRating value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <label className="label">Теги</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Добавить тег и Enter"
              />
              <button type="button" className="btn-secondary" onClick={addTag}>
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                    onClick={() =>
                      setValue(
                        'tags',
                        tags.filter((x) => x !== t),
                        { shouldDirty: true },
                      )
                    }
                  >
                    {t} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Заметки
            </label>
            <textarea
              id="notes"
              rows={4}
              className="input resize-y"
              {...register('notes')}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...register('isFavorite')}
            />
            В избранном
          </label>
        </div>

        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? 'Сохранение…' : submitLabel}
        </button>
      </form>

      {showScanner && (
        <IsbnScanner
          onResult={(isbn) => {
            setValue('isbn', isbn, { shouldDirty: true });
            setShowScanner(false);
            toast(`ISBN: ${isbn}`, 'success');
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
