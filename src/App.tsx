import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/components/ui/Toast';
import { importFromFile } from '@/lib/exportImport';
import { useBooks } from '@/hooks/useBooks';
import { useToast } from '@/components/ui/Toast';

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const LibraryPage = lazy(() =>
  import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const SearchPage = lazy(() =>
  import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })),
);
const StatsPage = lazy(() =>
  import('@/pages/StatsPage').then((m) => ({ default: m.StatsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const BookFormPage = lazy(() =>
  import('@/pages/BookFormPage').then((m) => ({ default: m.BookFormPage })),
);
const BookDetailPage = lazy(() =>
  import('@/pages/BookDetailPage').then((m) => ({ default: m.BookDetailPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );
}

function DropZone({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const books = useBooks();
  const { toast } = useToast();

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setActive(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      void importFromFile(file, 'merge', books)
        .then((r) => toast(`Импортировано ${r.imported} книг`, 'success'))
        .catch((err: unknown) =>
          toast(err instanceof Error ? err.message : 'Ошибка импорта', 'error'),
        );
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [books, toast]);

  return (
    <div className={active ? 'drop-active min-h-dvh' : 'min-h-dvh'}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 backdrop-blur-sm"
          >
            <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-2xl dark:bg-slate-900">
              <p className="text-lg font-semibold">Отпустите файл для импорта</p>
              <p className="text-sm text-slate-500">JSON, CSV или Excel</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <HashRouter>
          <DropZone>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="books/new" element={<BookFormPage />} />
                  <Route path="books/:id" element={<BookDetailPage />} />
                  <Route path="books/:id/edit" element={<BookFormPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </DropZone>
        </HashRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}
