import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface LikeButtonProps {
  isLiked?: boolean;
  onToggle: (e: React.MouseEvent | React.KeyboardEvent) => void;
  reportId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked = false,
  onToggle,
  reportId,
  className = '',
  size = 'md',
}) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    onToggle(e);
    setTimeout(() => setAnimating(false), 240);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setAnimating(true);
      onToggle(e);
      setTimeout(() => setAnimating(false), 240);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="button"
      aria-label={isLiked ? `Unflag report ${reportId || ''}` : `Flag report ${reportId || ''} for follow-up`}
      aria-pressed={isLiked}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg p-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
        isLiked
          ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
          : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
      title={isLiked ? 'Marked as priority follow-up' : 'Star for priority follow-up'}
    >
      <Star
        className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} ${
          isLiked ? 'fill-amber-500 stroke-amber-500' : 'stroke-current fill-none'
        } ${animating ? 'animate-like-pop' : ''}`}
      />
    </button>
  );
};
