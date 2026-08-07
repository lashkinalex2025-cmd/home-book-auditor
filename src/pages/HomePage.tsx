import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  CheckCircleIcon,
  HeartIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useBooks } from '@/hooks/useBooks';
import { BookCard } from '@/components/books/BookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { computeStats } from '@/lib/stats';
import { useMemo } from 'react';

export function HomePage() {
  const books = useBooks();
  const stats = useMemo(() => computeStats(books), [books]);

  const favorites = useMemo(() => books.filter((b) => b.isFavorite).slice(0, 6), [books]);
  const recent = useMemo(
    () => [...books].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [books],
  );
  const recentUpdates = useMemo(
    () => [...books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [books],
  );

  const cards = [
    {
      label: 'Всего книг',
      value: stats.total,
      icon: BookOpenIcon,
      color: 'from-brand-500 to-brand-700',
    },
    {
      label: 'Прочитано',
      value: stats.read,
      icon: CheckCircleIcon,
      color: 'from-emerald-500 to-emerald-700',
    },
    {
      label: 'Не прочитано',
      value: stats.unread,
      icon: ClockIcon,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Избранное',
      value: stats.favorites,
      icon: HeartIcon,
      color: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="page-subtitle">Добро пожаловать</p>
          <h1 className="page-title">Домашний книжный аудитор</h1>
        </div>
        <Link to="/books/new" className="btn-primary shrink-0">
          <PlusIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Добавить</span>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${c.color} p-4 text-white shadow-lg`}
          >
            <c.icon className="absolute -right-2 -top-2 h-16 w-16 opacity-20" />
            <p className="text-xs font-medium text-white/80">{c.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{c.value}</p>
          </motion.div>
        ))}
      </div>

      {books.length === 0 ? (
        <EmptyState
          title="Библиотека пуста"
          description="Добавьте первую книгу — вручную, через импорт или сканирование ISBN."
          action={
            <Link to="/books/new" className="btn-primary">
              <PlusIcon className="h-5 w-5" />
              Добавить книгу
            </Link>
          }
        />
      ) : (
        <>
          {favorites.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Любимые книги</h2>
                <Link
                  to="/library?favorites=1"
                  className="text-sm font-medium text-brand-700 dark:text-brand-300"
                >
                  Все
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {favorites.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Недавно добавленные</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="mb-3 text-lg font-semibold">Последние изменения</h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentUpdates.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/books/${b.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="truncate text-xs text-slate-500">{b.author}</p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-400">
                      {new Date(b.updatedAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
