import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ePub, { type Book as EpubBook, type Rendition } from 'epubjs';
import { useBook } from '@/hooks/useBooks';
import { getEbookFile, saveEbookProgress } from '@/db/database';
import { parseFb2ToText, readTextFromBlob } from '@/lib/ebook';
import { EBOOK_FORMAT_LABELS } from '@/types/book';

type LoadState = 'loading' | 'ready' | 'error';

export function EbookReaderPage() {
  const { id } = useParams();
  const bookId = Number(id);
  const book = useBook(bookId);
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [epubReady, setEpubReady] = useState(false);

  const epubContainerRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const textScrollRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<number | null>(null);

  const format = book?.ebookFormat ?? null;

  const scheduleProgress = useCallback(
    (value: string) => {
      if (!Number.isFinite(bookId)) return;
      if (progressTimer.current) window.clearTimeout(progressTimer.current);
      progressTimer.current = window.setTimeout(() => {
        void saveEbookProgress(bookId, value);
      }, 400);
    },
    [bookId],
  );

  // Cleanup blob URLs / epub on unmount
  useEffect(() => {
    return () => {
      if (progressTimer.current) window.clearTimeout(progressTimer.current);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      try {
        renditionRef.current?.destroy();
      } catch {
        /* ignore */
      }
      try {
        epubBookRef.current?.destroy();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on unmount
  }, []);

  useEffect(() => {
    if (Number.isNaN(bookId) || book === undefined) return;
    if (book === null) {
      setLoadState('error');
      setError('Книга не найдена');
      return;
    }
    if (!book.ebookFormat || !book.ebookFileName) {
      setLoadState('error');
      setError('К этой карточке не прикреплён файл электронной книги');
      return;
    }

    let cancelled = false;

    async function load() {
      setLoadState('loading');
      setError(null);
      setTextContent('');
      setEpubReady(false);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const record = await getEbookFile(bookId);
        if (cancelled) return;
        if (!record) {
          setLoadState('error');
          setError('Файл электронной книги не найден в хранилище');
          return;
        }

        const fmt = record.format;

        if (fmt === 'pdf') {
          const url = URL.createObjectURL(record.data);
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          setPdfUrl(url);
          setLoadState('ready');
          return;
        }

        if (fmt === 'txt') {
          const text = await readTextFromBlob(record.data);
          if (cancelled) return;
          setTextContent(text);
          setLoadState('ready');
          return;
        }

        if (fmt === 'fb2') {
          const text = await parseFb2ToText(record.data);
          if (cancelled) return;
          setTextContent(text);
          setLoadState('ready');
          return;
        }

        if (fmt === 'epub') {
          // epub init in separate effect after container mounts
          const ab = await record.data.arrayBuffer();
          if (cancelled) return;
          // store buffer on window-like ref via state blob
          const url = URL.createObjectURL(
            new Blob([ab], { type: 'application/epub+zip' }),
          );
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          setPdfUrl(url); // reuse as object url holder for epub source
          setLoadState('ready');
          return;
        }

        setLoadState('error');
        setError('Неизвестный формат файла');
      } catch (e) {
        if (cancelled) return;
        setLoadState('error');
        setError(e instanceof Error ? e.message : 'Ошибка загрузки файла');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookId, book]);

  // Restore text scroll progress
  useEffect(() => {
    if (loadState !== 'ready' || !textContent || !textScrollRef.current) return;
    const raw = book?.ebookProgress;
    if (!raw?.startsWith('scroll:')) return;
    const ratio = Number(raw.slice('scroll:'.length));
    if (!Number.isFinite(ratio)) return;
    const el = textScrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
    });
  }, [loadState, textContent, book?.ebookProgress]);

  // Init EPUB when ready
  useEffect(() => {
    if (loadState !== 'ready' || format !== 'epub' || !pdfUrl) return;
    const container = epubContainerRef.current;
    if (!container) return;

    let cancelled = false;
    const epubBook = ePub(pdfUrl);
    epubBookRef.current = epubBook;

    const rendition = epubBook.renderTo(container, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      allowScriptedContent: false,
    });
    renditionRef.current = rendition;

    rendition.themes.default({
      body: {
        'font-size': `${fontSize}px !important`,
        'line-height': '1.6 !important',
        padding: '0 4% !important',
      },
    });

    const startLocation = book?.ebookProgress?.startsWith('epub:')
      ? book.ebookProgress.slice('epub:'.length)
      : undefined;

    void epubBook.ready
      .then(() => {
        if (cancelled) return;
        return rendition.display(startLocation || undefined);
      })
      .then(() => {
        if (cancelled) return;
        setEpubReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadState('error');
        setError(e instanceof Error ? e.message : 'Не удалось открыть EPUB');
      });

    rendition.on('relocated', (location: { start?: { cfi?: string } }) => {
      const cfi = location?.start?.cfi;
      if (cfi) scheduleProgress(`epub:${cfi}`);
    });

    return () => {
      cancelled = true;
      try {
        rendition.destroy();
      } catch {
        /* ignore */
      }
      try {
        epubBook.destroy();
      } catch {
        /* ignore */
      }
      renditionRef.current = null;
      epubBookRef.current = null;
      setEpubReady(false);
    };
    // fontSize applied via separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, format, pdfUrl, bookId]);

  useEffect(() => {
    if (!renditionRef.current || format !== 'epub') return;
    renditionRef.current.themes.fontSize(`${fontSize}px`);
  }, [fontSize, format]);

  const title = book?.title ?? 'Читалка';

  const header = useMemo(
    () => (
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="button"
          className="btn-ghost p-2"
          onClick={() => {
            if (bookId) navigate(`/books/${bookId}`);
            else navigate(-1);
          }}
          aria-label="Назад"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          {format && (
            <p className="text-[11px] text-slate-500">{EBOOK_FORMAT_LABELS[format]}</p>
          )}
        </div>
        {(format === 'txt' || format === 'fb2' || format === 'epub') && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-ghost p-2"
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              aria-label="Уменьшить шрифт"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-xs tabular-nums text-slate-500">
              {fontSize}
            </span>
            <button
              type="button"
              className="btn-ghost p-2"
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
              aria-label="Увеличить шрифт"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>
    ),
    [bookId, format, fontSize, navigate, title],
  );

  if (Number.isNaN(bookId)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
        <p className="text-rose-500">Некорректный идентификатор</p>
        <Link to="/library" className="btn-primary">
          В библиотеку
        </Link>
      </div>
    );
  }

  if (book === undefined || loadState === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (loadState === 'error' || book === null) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-rose-500">{error || 'Ошибка'}</p>
          <Link to={bookId ? `/books/${bookId}` : '/library'} className="btn-primary">
            Назад к книге
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {header}

      {format === 'pdf' && pdfUrl && (
        <iframe
          title={title}
          src={pdfUrl}
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      )}

      {(format === 'txt' || format === 'fb2') && (
        <div
          ref={textScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8"
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollHeight - el.clientHeight;
            const ratio = max > 0 ? el.scrollTop / max : 0;
            scheduleProgress(`scroll:${ratio.toFixed(4)}`);
          }}
        >
          <article
            className="mx-auto max-w-2xl whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-100"
            style={{ fontSize: `${fontSize}px` }}
          >
            {textContent}
          </article>
        </div>
      )}

      {format === 'epub' && (
        <div className="relative min-h-0 flex-1">
          <div
            ref={epubContainerRef}
            className="absolute inset-0 bg-white dark:bg-slate-900"
          />
          {epubReady && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-3">
              <button
                type="button"
                className="pointer-events-auto btn-secondary shadow-lg"
                onClick={() => void renditionRef.current?.prev()}
              >
                <ChevronLeftIcon className="h-5 w-5" />
                Назад
              </button>
              <button
                type="button"
                className="pointer-events-auto btn-secondary shadow-lg"
                onClick={() => void renditionRef.current?.next()}
              >
                Вперёд
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
