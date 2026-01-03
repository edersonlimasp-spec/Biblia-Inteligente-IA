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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 pointer-events-none z-10" />
        )}
        <textarea
          ref={setRefs}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={adjustHeight}
          className={cn(
            "flex w-full rounded-2xl",
            "border-2 border-border/40 dark:border-border/30",
            "bg-background dark:bg-card/80",
            "text-base text-foreground placeholder:text-muted-foreground/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60",
            "transition-all duration-200 ease-out",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
            "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
            "focus:shadow-[0_4px_16px_rgba(0,0,0,0.1)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
            "resize-none overflow-hidden",
            "leading-relaxed tracking-normal",
            showIcon && iconPosition === "left" ? "pl-12 pr-4" : "px-4",
            showIcon && iconPosition === "right" ? "pr-12 pl-4" : "",
            "py-3.5",
            className
          )}
          style={{
            minHeight,
            maxHeight,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', sans-serif",
            fontSize: '15px',
            letterSpacing: '-0.01em',
          }}
          {...props}
        />
        {showIcon && iconPosition === "right" && (
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 pointer-events-none z-10" />
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
