import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { BookForm } from '@/components/books/BookForm';
import { useBook } from '@/hooks/useBooks';
import { addBook, saveEbookFile, updateBook } from '@/db/database';
import type { BookFormValues } from '@/lib/validation';
import { useToast } from '@/components/ui/Toast';
import { validateEbookFile } from '@/lib/ebook';

export function BookFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const bookId = isNew ? undefined : Number(id);
  const book = useBook(bookId);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function attachEbook(targetId: number, file: File) {
    const check = validateEbookFile(file);
    if (!check.ok) {
      toast(check.error, 'error');
      return;
    }
    await saveEbookFile(targetId, file, check.format, check.mimeType);
  }

  async function handleSubmit(values: BookFormValues, pendingEbook?: File | null) {
    try {
      // метаданные файла выставляются saveEbookFile; в карточке не дублируем
      const {
        ebookFileName: _fn,
        ebookFormat: _ff,
        ebookSize: _fs,
        ebookProgress: _fp,
        ...cardValues
      } = values;

      if (isNew) {
        const newId = await addBook({
          ...cardValues,
          ebookFileName: null,
          ebookFormat: null,
          ebookSize: null,
          ebookProgress: null,
        });
        if (pendingEbook) {
          try {
            await attachEbook(newId, pendingEbook);
          } catch {
            toast('Книга сохранена, но файл e-book не удалось загрузить', 'error');
            navigate(`/books/${newId}`, { replace: true });
            return;
          }
        }
        toast('Книга добавлена', 'success');
        navigate(`/books/${newId}`, { replace: true });
      } else if (bookId != null) {
        await updateBook(bookId, {
          ...cardValues,
          // не затираем ebook-метаданные при обычном сохранении формы
          ebookFileName: book?.ebookFileName ?? null,
          ebookFormat: book?.ebookFormat ?? null,
          ebookSize: book?.ebookSize ?? null,
          ebookProgress: book?.ebookProgress ?? null,
        });
        if (pendingEbook) {
          try {
            await attachEbook(bookId, pendingEbook);
          } catch {
            toast('Изменения сохранены, но файл e-book не удалось загрузить', 'error');
            navigate(`/books/${bookId}`, { replace: true });
            return;
          }
        }
        toast('Изменения сохранены', 'success');
        navigate(`/books/${bookId}`, { replace: true });
      }
    } catch {
      toast('Не удалось сохранить книгу', 'error');
    }
  }

  if (!isNew && (bookId == null || Number.isNaN(bookId))) {
    return <p className="text-rose-500">Некорректный идентификатор книги</p>;
  }

  if (!isNew && book === undefined) {
    return <p className="page-subtitle">Загрузка…</p>;
  }

  if (!isNew && book === null) {
    return (
      <div className="space-y-3">
        <p className="text-rose-500">Книга не найдена</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/library')}
        >
          В библиотеку
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center gap-3">
        <button type="button" className="btn-ghost p-2" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">{isNew ? 'Новая книга' : 'Редактирование'}</h1>
          <p className="page-subtitle">
            {isNew ? 'Заполните карточку книги' : book?.title}
          </p>
        </div>
      </header>

      <BookForm
        initial={isNew || !book ? undefined : book}
        onSubmit={handleSubmit}
        submitLabel={isNew ? 'Добавить книгу' : 'Сохранить'}
      />
    </div>
  );
}
