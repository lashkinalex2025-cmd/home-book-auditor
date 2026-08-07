import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Рейтинг">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        const Icon = active ? StarSolid : StarOutline;
        return (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            className={`rounded p-0.5 ${
              active ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
            } ${onChange ? 'hover:scale-110' : 'cursor-default'}`}
            onClick={() => onChange?.(n === value ? 0 : n)}
            aria-label={`${n} звезд`}
          >
            <Icon className={cls} />
          </button>
        );
      })}
    </div>
  );
}
