export const BOOK_STATUSES = [
  'want',
  'owned',
  'reading',
  'read',
  'sold',
  'gifted',
] as const;

export type BookStatus = (typeof BOOK_STATUSES)[number];

export const STATUS_LABELS: Record<BookStatus, string> = {
  want: 'Хочу купить',
  owned: 'Куплена',
  reading: 'Читаю',
  read: 'Прочитана',
  sold: 'Продана',
  gifted: 'Подарена',
};

export const STATUS_COLORS: Record<BookStatus, string> = {
  want: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  owned: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  reading: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  read: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  sold: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  gifted: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
};

export interface Book {
  id?: number;
  title: string;
  author: string;
  series: string;
  volume: string;
  genre: string;
  isbn: string;
  publisher: string;
  year: number | null;
  language: string;
  pages: number | null;
  purchaseDate: string;
  price: number | null;
  location: string;
  status: BookStatus;
  rating: number;
  notes: string;
  tags: string[];
  coverDataUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookInput = Omit<Book, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface BookFilters {
  query: string;
  status: BookStatus | 'all';
  genre: string;
  author: string;
  tag: string;
  series: string;
  favoritesOnly: boolean;
  sortBy: SortField;
  sortDir: 'asc' | 'desc';
}

export type SortField =
  | 'title'
  | 'author'
  | 'year'
  | 'rating'
  | 'price'
  | 'pages'
  | 'createdAt'
  | 'updatedAt'
  | 'status';

export interface AppSettings {
  id: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ru' | 'en';
  cardSize: 'sm' | 'md' | 'lg';
  currency: string;
  lastBackupAt: string | null;
  pushEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  theme: 'system',
  language: 'ru',
  cardSize: 'md',
  currency: '₽',
  lastBackupAt: null,
  pushEnabled: false,
};

export const EMPTY_BOOK: BookInput = {
  title: '',
  author: '',
  series: '',
  volume: '',
  genre: '',
  isbn: '',
  publisher: '',
  year: null,
  language: 'ru',
  pages: null,
  purchaseDate: '',
  price: null,
  location: '',
  status: 'owned',
  rating: 0,
  notes: '',
  tags: [],
  coverDataUrl: null,
  isFavorite: false,
};

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  books: Book[];
  settings: AppSettings;
}
