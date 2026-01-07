/**
 * Strong Word Component - Reutilizável
 * Palavra individual com suporte a Strong's Dictionary
 * Aplicação unificada de cor/estilo em TODA a Bíblia
 * OTIMIZADO com React.memo para performance em iOS
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface StrongWordProps {
  text: string;
  hasStrong: boolean;
  onWordClick?: (word: string) => void;
  className?: string;
}

export const StrongWord = memo(function StrongWord({
  text,
  hasStrong,
  onWordClick,
  className,
}: StrongWordProps) {
  return (
    <span
      onClick={() => {
        if (hasStrong && onWordClick) {
          onWordClick(text);
        }
      }}
      className={cn(
        'inline',
        hasStrong && 'strong-word',
        hasStrong && 'cursor-pointer transition-colors',
        !hasStrong && 'cursor-default',
        className
      )}
      data-testid={hasStrong ? `strong-word-${text}` : `word-${text}`}
      role={hasStrong ? 'button' : undefined}
      tabIndex={hasStrong ? 0 : undefined}
      aria-label={hasStrong ? `Palavra ${text} - Clique para abrir dicionário` : undefined}
    >
      {text}
    </span>
  );
});
