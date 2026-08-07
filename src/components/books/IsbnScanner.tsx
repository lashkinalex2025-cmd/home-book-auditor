import { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';

interface IsbnScannerProps {
  onResult: (isbn: string) => void;
  onClose: () => void;
}

function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(/[^\dXx]/g, '');
  if (digits.length === 10 || digits.length === 13) return digits.toUpperCase();
  return null;
}

export function IsbnScanner({ onResult, onClose }: IsbnScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const started = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const id = 'isbn-reader';
    let cancelled = false;

    async function start() {
      try {
        const scanner = new Html5Qrcode(id);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 260, height: 140 }, aspectRatio: 1.7 },
          (decoded) => {
            const isbn = normalizeIsbn(decoded);
            if (isbn) {
              onResultRef.current(isbn);
            }
          },
          () => undefined,
        );
        started.current = true;
      } catch {
        if (!cancelled) {
          setError(
            'Камера недоступна. Введите ISBN вручную или разрешите доступ к камере.',
          );
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && started.current) {
        s.stop()
          .then(() => s.clear())
          .catch(() => undefined);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="card w-full max-w-md overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Сканер ISBN</h2>
          <button type="button" className="btn-ghost p-2" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          id="isbn-reader"
          className="overflow-hidden rounded-2xl bg-slate-900 [&_video]:rounded-2xl"
        />

        {error && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{error}</p>
        )}

        <div className="mt-4 space-y-2">
          <label className="label" htmlFor="manual-isbn">
            Или введите вручную
          </label>
          <div className="flex gap-2">
            <input
              id="manual-isbn"
              className="input"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="978..."
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const isbn = normalizeIsbn(manual);
                if (isbn) onResult(isbn);
                else setError('Некорректный ISBN (10 или 13 символов)');
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
