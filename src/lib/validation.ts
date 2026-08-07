import { z } from 'zod';
import { BOOK_STATUSES } from '@/types/book';

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Укажите название')
    .max(300, 'Слишком длинное название'),
  author: z.string().trim().max(200, 'Слишком длинное имя автора'),
  series: z.string().trim().max(200),
  volume: z.string().trim().max(50),
  genre: z.string().trim().max(100),
  isbn: z
    .string()
    .trim()
    .max(20)
    .regex(/^[\d\-Xx\s]*$/, 'ISBN может содержать только цифры, X и дефисы'),
  publisher: z.string().trim().max(200),
  year: z
    .union([z.number().int().min(1000).max(2100), z.null()])
    .optional()
    .transform((v) => v ?? null),
  language: z.string().trim().max(50),
  pages: z
    .union([z.number().int().min(1).max(100_000), z.null()])
    .optional()
    .transform((v) => v ?? null),
  purchaseDate: z.string(),
  price: z
    .union([z.number().min(0).max(1_000_000_000), z.null()])
    .optional()
    .transform((v) => v ?? null),
  location: z.string().trim().max(200),
  status: z.enum(BOOK_STATUSES),
  rating: z.number().min(0).max(5),
  notes: z.string().max(5000),
  tags: z.array(z.string().trim().min(1).max(50)).max(30),
  coverDataUrl: z.string().nullable(),
  isFavorite: z.boolean(),
});

export type BookFormValues = z.infer<typeof bookSchema>;

export function sanitizeText(value: unknown, max = 500): string {
  if (typeof value !== 'string') return '';
  let out = '';
  for (let i = 0; i < value.length && out.length < max; i += 1) {
    const code = value.charCodeAt(i);
    // strip C0 controls except tab (\t) and newline (\n, \r)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;
    out += value[i];
  }
  return out;
}

export function sanitizeBookImport(raw: unknown): BookFormValues | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const yearRaw = o.year;
  const pagesRaw = o.pages;
  const priceRaw = o.price;
  const ratingRaw = o.rating;

  const candidate = {
    title: sanitizeText(o.title, 300),
    author: sanitizeText(o.author, 200),
    series: sanitizeText(o.series, 200),
    volume: sanitizeText(o.volume, 50),
    genre: sanitizeText(o.genre, 100),
    isbn: sanitizeText(o.isbn, 20),
    publisher: sanitizeText(o.publisher, 200),
    year:
      yearRaw === '' || yearRaw === undefined || yearRaw === null
        ? null
        : Number(yearRaw),
    language: sanitizeText(o.language, 50) || 'ru',
    pages:
      pagesRaw === '' || pagesRaw === undefined || pagesRaw === null
        ? null
        : Number(pagesRaw),
    purchaseDate: sanitizeText(o.purchaseDate, 30),
    price:
      priceRaw === '' || priceRaw === undefined || priceRaw === null
        ? null
        : Number(priceRaw),
    location: sanitizeText(o.location, 200),
    status: typeof o.status === 'string' ? o.status : 'owned',
    rating: ratingRaw === undefined || ratingRaw === null ? 0 : Number(ratingRaw),
    notes: sanitizeText(o.notes, 5000),
    tags: Array.isArray(o.tags)
      ? o.tags.map((t) => sanitizeText(t, 50)).filter(Boolean).slice(0, 30)
      : typeof o.tags === 'string'
        ? o.tags
            .split(/[,;]/)
            .map((t) => sanitizeText(t, 50))
            .filter(Boolean)
            .slice(0, 30)
        : [],
    coverDataUrl:
      typeof o.coverDataUrl === 'string' && o.coverDataUrl.startsWith('data:image/')
        ? o.coverDataUrl.slice(0, 2_000_000)
        : null,
    isFavorite: Boolean(o.isFavorite),
  };

  const parsed = bookSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
