import { BookOpenIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';

interface BookCoverProps {
  src: string | null | undefined;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-16 w-12',
  md: 'h-28 w-20',
  lg: 'h-40 w-28',
};

export const BookCover = memo(function BookCover({
  src,
  title,
  size = 'md',
  className = '',
}: BookCoverProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 shadow-inner dark:from-brand-900 dark:to-brand-950 ${sizeMap[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-1 text-brand-700 dark:text-brand-300">
          <BookOpenIcon className="h-6 w-6 opacity-70" />
          <span className="mt-1 line-clamp-3 text-center text-[9px] font-semibold leading-tight">
            {title}
          </span>
        </div>
      )}
    </div>
  );
});
