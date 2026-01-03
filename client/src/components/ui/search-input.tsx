import { forwardRef, TextareaHTMLAttributes, KeyboardEvent, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface SearchInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onKeyDown'> {
  onSearch?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  showIcon?: boolean;
  iconPosition?: "left" | "right";
  minHeight?: string;
  maxHeight?: string;
  autoResize?: boolean;
  singleLine?: boolean;
}

const SearchInput = forwardRef<HTMLTextAreaElement, SearchInputProps>(
  ({ 
    className, 
    onSearch, 
    onKeyDown,
    showIcon = true, 
    iconPosition = "left",
    minHeight = "44px",
    maxHeight = "120px",
    autoResize = true,
    singleLine = false,
    ...props 
  }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        if (singleLine || !e.shiftKey) {
          e.preventDefault();
          onSearch?.();
        }
      }
      onKeyDown?.(e);
    };

    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = minHeight;
        const scrollHeight = textarea.scrollHeight;
        const maxHeightPx = parseInt(maxHeight);
        textarea.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`;
      }
    }, [autoResize, minHeight, maxHeight]);

    useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    return (
      <div className="relative w-full">
        {showIcon && iconPosition === "left" && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        )}
        <textarea
          ref={setRefs}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={adjustHeight}
          className={cn(
            "flex w-full rounded-xl border border-input/50 bg-muted/30 dark:bg-muted/20",
            "text-base text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50",
            "transition-all duration-200 ease-in-out",
            "shadow-sm hover:shadow-md focus:shadow-md",
            "resize-none overflow-hidden",
            "font-sans leading-relaxed",
            showIcon && iconPosition === "left" ? "pl-10 pr-4" : "px-4",
            showIcon && iconPosition === "right" ? "pr-10 pl-4" : "",
            "py-3",
            className
          )}
          style={{
            minHeight,
            maxHeight,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          {...props}
        />
        {showIcon && iconPosition === "right" && (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
