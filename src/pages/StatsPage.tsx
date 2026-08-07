import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useBooks } from '@/hooks/useBooks';
import { computeStats } from '@/lib/stats';
import { useSettings } from '@/context/SettingsContext';
import { STATUS_LABELS, type BookStatus } from '@/types/book';
import { EmptyState } from '@/components/ui/EmptyState';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const palette = [
  '#0f766e',
  '#0891b2',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#475569',
];

export function StatsPage() {
  const books = useBooks();
  const { settings, resolvedTheme } = useSettings();
  const stats = useMemo(() => computeStats(books), [books]);

  const tick = resolvedTheme === 'dark' ? '#94a3b8' : '#64748b';
  const grid = resolvedTheme === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)';

  if (!books.length) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">Статистика</h1>
        <EmptyState
          title="Нет данных"
          description="Добавьте книги, чтобы увидеть графики"
        />
      </div>
    );
  }

  const genreData = {
    labels: stats.byGenre.map((x) => x.label),
    datasets: [
      {
        data: stats.byGenre.map((x) => x.value),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  };

  const authorData = {
    labels: stats.byAuthor.map((x) => x.label),
    datasets: [
      {
        label: 'Книг',
        data: stats.byAuthor.map((x) => x.value),
        backgroundColor: '#0f766e',
        borderRadius: 8,
      },
    ],
  };

  const monthData = {
    labels: stats.byMonth.map((x) => x.label),
    datasets: [
      {
        label: 'Добавлено',
        data: stats.byMonth.map((x) => x.value),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13,148,136,0.15)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: tick },
      },
    },
    scales: {
      x: { ticks: { color: tick }, grid: { color: grid } },
      y: { ticks: { color: tick }, grid: { color: grid }, beginAtZero: true },
    },
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="page-title">Статистика</h1>
        <p className="page-subtitle">Обзор вашей библиотеки</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Книг" value={String(stats.total)} />
        <StatTile
          label="Стоимость"
          value={`${stats.totalValue.toLocaleString('ru-RU')} ${settings.currency}`}
        />
        <StatTile
          label="Страниц"
          value={stats.totalPages.toLocaleString('ru-RU')}
        />
        <StatTile label="Читаю сейчас" value={String(stats.reading)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">По жанрам</h2>
          <div className="mx-auto h-64 max-w-xs">
            <Doughnut
              data={genreData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: tick } } },
              }}
            />
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Топ авторов</h2>
          <div className="h-64">
            <Bar data={authorData} options={chartOpts} />
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Динамика добавления</h2>
          <div className="h-64">
            <Line data={monthData} options={chartOpts} />
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">По статусам</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.byStatus.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
              >
                <span className="text-sm">
                  {STATUS_LABELS[s.label as BookStatus] ?? s.label}
                </span>
                <span className="font-semibold text-brand-700 dark:text-brand-300">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
    </div>
  );
}
