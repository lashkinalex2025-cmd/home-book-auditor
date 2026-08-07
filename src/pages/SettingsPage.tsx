import { useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BellIcon,
  CloudArrowDownIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { useBooks } from '@/hooks/useBooks';
import { useToast } from '@/components/ui/Toast';
import {
  createBackup,
  exportBooksCsv,
  exportBooksExcel,
  exportBooksJson,
  importFromFile,
  shareLibrary,
} from '@/lib/exportImport';
import { clearAllBooks, updateSettings as saveBackupMeta } from '@/db/database';
import { getPushSupport, registerPushSubscription } from '@/lib/push';

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const books = useBooks();
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [busy, setBusy] = useState(false);
  const push = getPushSupport();

  async function handleImport(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await importFromFile(file, importMode, books);
      toast(
        `Импортировано ${result.imported} книг (${result.mode === 'replace' ? 'замена' : 'слияние'})`,
        'success',
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка импорта', 'error');
    } finally {
      setBusy(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function handleBackup() {
    createBackup(books, settings);
    await saveBackupMeta({ lastBackupAt: new Date().toISOString() });
    toast('Резервная копия скачана', 'success');
  }

  async function handleClear() {
    if (!confirm('Удалить ВСЕ книги? Это действие нельзя отменить.')) return;
    if (!confirm('Точно удалить всю библиотеку?')) return;
    await clearAllBooks();
    toast('База очищена', 'success');
  }

  async function handleShare() {
    try {
      const ok = await shareLibrary(books, settings);
      if (!ok) {
        createBackup(books, settings);
        toast('Web Share недоступен — файл скачан', 'info');
      } else {
        toast('Готово', 'success');
      }
    } catch {
      toast('Не удалось поделиться', 'error');
    }
  }

  async function handlePush() {
    const result = await registerPushSubscription();
    await updateSettings({ pushEnabled: result.ok });
    toast(result.message, result.ok ? 'success' : 'info');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="page-title">Настройки</h1>
        <p className="page-subtitle">Внешний вид, данные и резервные копии</p>
      </header>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Интерфейс</h2>
        <div>
          <label className="label" htmlFor="theme">
            Тема
          </label>
          <select
            id="theme"
            className="input"
            value={settings.theme}
            onChange={(e) =>
              void updateSettings({
                theme: e.target.value as 'light' | 'dark' | 'system',
              })
            }
          >
            <option value="system">Автоматически</option>
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="language">
            Язык
          </label>
          <select
            id="language"
            className="input"
            value={settings.language}
            onChange={(e) =>
              void updateSettings({ language: e.target.value as 'ru' | 'en' })
            }
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cardSize">
            Размер карточек
          </label>
          <select
            id="cardSize"
            className="input"
            value={settings.cardSize}
            onChange={(e) =>
              void updateSettings({
                cardSize: e.target.value as 'sm' | 'md' | 'lg',
              })
            }
          >
            <option value="sm">Компактный</option>
            <option value="md">Обычный</option>
            <option value="lg">Крупный</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="currency">
            Валюта
          </label>
          <input
            id="currency"
            className="input"
            value={settings.currency}
            onChange={(e) =>
              void updateSettings({ currency: e.target.value.slice(0, 5) })
            }
          />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Экспорт</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportBooksJson(books, settings)}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportBooksCsv(books)}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            CSV
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportBooksExcel(books)}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Excel
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Импорт</h2>
        <div>
          <label className="label">Режим</label>
          <select
            className="input"
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
          >
            <option value="merge">Добавить к существующим</option>
            <option value="replace">Заменить всю библиотеку</option>
          </select>
        </div>
        <input
          ref={importRef}
          type="file"
          accept=".json,.csv,.xlsx,.xls,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => void handleImport(e.target.files?.[0])}
        />
        <button
          type="button"
          className="btn-primary w-full"
          disabled={busy}
          onClick={() => importRef.current?.click()}
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          {busy ? 'Импорт…' : 'Выбрать файл (JSON / CSV / Excel)'}
        </button>
        <p className="text-xs text-slate-400">
          Повреждённые и невалидные записи пропускаются. Обложки принимаются только как
          data:image.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Резервное копирование</h2>
        <p className="text-sm text-slate-500">
          Последняя копия:{' '}
          {settings.lastBackupAt
            ? new Date(settings.lastBackupAt).toLocaleString('ru-RU')
            : 'ещё не создавалась'}
        </p>
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => void handleBackup()}
        >
          <CloudArrowDownIcon className="h-5 w-5" />
          Создать резервную копию
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => void handleShare()}
        >
          <ShareIcon className="h-5 w-5" />
          Поделиться / Web Share
        </button>
        <p className="text-xs text-slate-400">
          Восстановление: импортируйте JSON-файл резервной копии в режиме «Заменить».
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Уведомления</h2>
        <p className="text-sm text-slate-500">
          Поддержка: {push.supported ? 'да' : 'нет'} · SW:{' '}
          {push.serviceWorker ? 'да' : 'нет'} · право: {push.permission}
        </p>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => void handlePush()}
        >
          <BellIcon className="h-5 w-5" />
          Запросить разрешение (архитектура готова)
        </button>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-rose-600 dark:text-rose-400">Опасная зона</h2>
        <button
          type="button"
          className="btn-danger w-full"
          onClick={() => void handleClear()}
        >
          <TrashIcon className="h-5 w-5" />
          Очистить базу книг
        </button>
      </section>

      <section className="card space-y-2 p-5 text-sm text-slate-500">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">О приложении</h2>
        <p>Домашний книжный аудитор v1.0.0</p>
        <p>Данные хранятся локально (IndexedDB). PWA · офлайн · Capacitor Android.</p>
        <p className="text-xs">
          Установите приложение через «Добавить на главный экран» или соберите APK через
          Capacitor.
        </p>
      </section>
    </div>
  );
}
