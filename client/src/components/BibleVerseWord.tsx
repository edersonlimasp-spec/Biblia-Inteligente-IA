/**
 * Individual Word Component with Strong's Support
 * Mostra palavra com destaque sutil se tem Strong Number
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BibleVerseWordProps {
  word: string;
  strongNumber: string | null;
  onWordClick?: (word: string) => void;
  className?: string;
}

export function BibleVerseWord({
  word,
  strongNumber,
  onWordClick,
  className,
}: BibleVerseWordProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasStrong = !!strongNumber;
  
  return (
    <span
      onClick={() => {
        if (hasStrong && onWordClick) {
          onWordClick(word);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'transition-colors duration-200',
        hasStrong && 'cursor-pointer',
        // Destaque sutil: cor levemente mais escura quando tem Strong
        hasStrong && 'border-b border-dotted border-muted-foreground/30',
        isHovered && hasStrong && 'border-b-2 border-primary/50 bg-accent/20',
        className
      )}
      data-testid={hasStrong ? `word-with-strong-${strongNumber}` : 'word-no-strong'}
      title={hasStrong ? `Strong: ${strongNumber}` : undefined}
    >
      {word}
    </span>
  );
}
