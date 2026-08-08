import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  DocumentArrowUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { Book } from '@/types/book';
import { EBOOK_FORMAT_LABELS } from '@/types/book';
import { EBOOK_ACCEPT, formatFileSize, hasEbook, validateEbookFile } from '@/lib/ebook';
import { removeEbookFile, saveEbookFile } from '@/db/database';
import { useToast } from '@/components/ui/Toast';

interface EbookPanelProps {
  book: Book;
  /** Для формы новой книги: файл ещё не привязан к id */
  pendingFile?: File | null;
  onPendingFileChange?: (file: File | null) => void;
  compact?: boolean;
}

export function EbookPanel({
  book,
  pendingFile = null,
  onPendingFileChange,
  compact = false,
}: EbookPanelProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const bookId = book.id;
  const attached =
    pendingFile != null
      ? {
          name: pendingFile.name,
          size: pendingFile.size,
          formatLabel: (() => {
            const v = validateEbookFile(pendingFile);
            return v.ok ? EBOOK_FORMAT_LABELS[v.format] : 'файл';
          })(),
        }
      : hasEbook(book)
        ? {
            name: book.ebookFileName!,
            size: book.ebookSize ?? 0,
            formatLabel: book.ebookFormat
              ? EBOOK_FORMAT_LABELS[book.ebookFormat]
              : 'файл',
          }
        : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const check = validateEbookFile(file);
    if (!check.ok) {
      toast(check.error, 'error');
      return;
    }

    if (bookId == null) {
      onPendingFileChange?.(file);
      toast(`Файл «${file.name}» будет сохранён вместе с книгой`, 'success');
      return;
    }

    try {
      setBusy(true);
      await saveEbookFile(bookId, file, check.format, check.mimeType);
      toast('Электронная книга загружена', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось сохранить файл', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (bookId == null) {
      onPendingFileChange?.(null);
      toast('Файл откреплён', 'success');
      return;
    }
    if (!confirm('Удалить электронную книгу с устройства?')) return;
    try {
      setBusy(true);
      await removeEbookFile(bookId);
      toast('Электронная книга удалена', 'success');
    } catch {
      toast('Не удалось удалить файл', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'card space-y-3 p-5'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Электронная книга
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            EPUB, PDF, TXT, FB2 · до 50 МБ · хранится только на этом устройстве
          </p>
        </div>
      </div>

      {attached ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="truncate text-sm font-medium">{attached.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {attached.formatLabel} · {formatFileSize(attached.size)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Файл ещё не загружен</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <DocumentArrowUpIcon className="h-5 w-5" />
          {attached ? 'Заменить файл' : 'Загрузить файл'}
        </button>

        {attached && bookId != null && (
          <Link to={`/books/${bookId}/read`} className="btn-primary">
            <BookOpenIcon className="h-5 w-5" />
            Читать
          </Link>
        )}

        {attached && (
          <button
            type="button"
            className="btn-ghost text-rose-600"
            disabled={busy}
            onClick={() => void handleRemove()}
          >
            <TrashIcon className="h-5 w-5" />
            Удалить
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={EBOOK_ACCEPT}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
