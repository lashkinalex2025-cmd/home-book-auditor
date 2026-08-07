import * as XLSX from 'xlsx';
import type { AppSettings, BackupPayload, Book } from '@/types/book';
import { sanitizeBookImport } from '@/lib/validation';
import { replaceAllBooks, updateSettings } from '@/db/database';

const BOOK_COLUMNS: (keyof Book)[] = [
  'title',
  'author',
  'series',
  'volume',
  'genre',
  'isbn',
  'publisher',
  'year',
  'language',
  'pages',
  'purchaseDate',
  'price',
  'location',
  'status',
  'rating',
  'notes',
  'tags',
  'isFavorite',
  'createdAt',
  'updatedAt',
];

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function booksToRows(books: Book[]): Record<string, unknown>[] {
  return books.map((b) => ({
    ...Object.fromEntries(BOOK_COLUMNS.map((k) => [k, b[k] ?? ''])),
    tags: Array.isArray(b.tags) ? b.tags.join('; ') : '',
    isFavorite: b.isFavorite ? 1 : 0,
  }));
}

export function exportBooksJson(books: Book[], settings: AppSettings): void {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  downloadBlob(blob, `library-backup-${dateStamp()}.json`);
}

export function exportBooksCsv(books: Book[]): void {
  const ws = XLSX.utils.json_to_sheet(booksToRows(books));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `library-${dateStamp()}.csv`);
}

export function exportBooksExcel(books: Book[]): void {
  const ws = XLSX.utils.json_to_sheet(booksToRows(books));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `library-${dateStamp()}.xlsx`);
}

export function createBackup(books: Book[], settings: AppSettings): void {
  exportBooksJson(books, settings);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseJsonPayload(text: string): { books: Book[]; settings?: AppSettings } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Файл JSON повреждён или имеет неверный формат');
  }

  if (Array.isArray(data)) {
    return { books: normalizeBookList(data) };
  }

  if (data && typeof data === 'object' && Array.isArray((data as BackupPayload).books)) {
    const payload = data as BackupPayload;
    return {
      books: normalizeBookList(payload.books),
      settings: payload.settings,
    };
  }

  throw new Error('Не удалось распознать структуру резервной копии');
}

function normalizeBookList(list: unknown[]): Book[] {
  const books: Book[] = [];
  for (const item of list) {
    const sanitized = sanitizeBookImport(item);
    if (!sanitized || !sanitized.title) continue;
    const now = new Date().toISOString();
    const raw = item as Record<string, unknown>;
    books.push({
      ...sanitized,
      createdAt:
        typeof raw.createdAt === 'string' ? raw.createdAt : now,
      updatedAt:
        typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    });
  }
  return books;
}

function parseTableFile(buffer: ArrayBuffer, filename: string): Book[] {
  const wb = XLSX.read(buffer, { type: 'array', raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('В файле нет листов');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });
  if (!rows.length && !filename) {
    throw new Error('Файл пуст');
  }
  return normalizeBookList(rows);
}

export async function importFromFile(
  file: File,
  mode: 'replace' | 'merge',
  existingBooks: Book[],
): Promise<{ imported: number; mode: 'replace' | 'merge' }> {
  const name = file.name.toLowerCase();
  let books: Book[] = [];
  let settings: AppSettings | undefined;

  if (name.endsWith('.json')) {
    const text = await file.text();
    const parsed = parseJsonPayload(text);
    books = parsed.books;
    settings = parsed.settings;
  } else if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    books = parseTableFile(buffer, file.name);
  } else {
    throw new Error('Поддерживаются только JSON, CSV и Excel (.xlsx)');
  }

  if (!books.length) {
    throw new Error('В файле не найдено валидных книг');
  }

  if (mode === 'replace') {
    await replaceAllBooks(books);
  } else {
    const merged = [...existingBooks, ...books];
    await replaceAllBooks(merged);
  }

  if (settings) {
    const { id: _id, ...rest } = settings;
    await updateSettings({
      theme: rest.theme,
      language: rest.language,
      cardSize: rest.cardSize,
      currency: rest.currency,
      lastBackupAt: rest.lastBackupAt,
      pushEnabled: rest.pushEnabled,
    });
  }

  await updateSettings({ lastBackupAt: new Date().toISOString() });

  return { imported: books.length, mode };
}

export async function shareLibrary(books: Book[], settings: AppSettings): Promise<boolean> {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    settings,
  };
  const text = JSON.stringify(payload, null, 2);
  const file = new File([text], `library-${dateStamp()}.json`, {
    type: 'application/json',
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'Домашний книжный аудитор',
      text: `Резервная копия: ${books.length} книг`,
      files: [file],
    });
    return true;
  }

  if (navigator.share) {
    await navigator.share({
      title: 'Домашний книжный аудитор',
      text: text.slice(0, 2000),
    });
    return true;
  }

  return false;
}
