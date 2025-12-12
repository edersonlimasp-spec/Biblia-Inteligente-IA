/**
 * Global Sharing Utilities for Bíblia Inteligente IA
 * Ensures all shared content includes the app signature footer
 */

export const APP_NAME = "Bíblia Inteligente IA";
export const APP_URL = "https://bibliainteligente.replit.app";

/**
 * Standard footer to append to all shared content
 */
export const getShareFooter = (): string => {
  return `\n---\nEnviado por ${APP_NAME}\nConheça a BI: ${APP_URL}`;
};

/**
 * Add the standard footer to any content being shared
 */
export const addShareFooter = (content: string): string => {
  return `${content}${getShareFooter()}`;
};

/**
 * Share content using navigator.share (native) with fallback to clipboard
 */
export const shareContent = async (
  content: string,
  options?: {
    title?: string;
    onCopied?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<boolean> => {
  const textWithFooter = addShareFooter(content);
  
  if (navigator.share) {
    try {
      await navigator.share({ 
        text: textWithFooter,
        ...(options?.title && { title: options.title })
      });
      return true;
    } catch (e) {
      const error = e as Error;
      if (error.name !== "AbortError") {
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(textWithFooter);
          options?.onCopied?.();
          return true;
        } catch {
          options?.onError?.(error);
          return false;
        }
      }
      return false; // User cancelled
    }
  } else {
    // No native share - use clipboard
    try {
      await navigator.clipboard.writeText(textWithFooter);
      options?.onCopied?.();
      return true;
    } catch (e) {
      options?.onError?.(e as Error);
      return false;
    }
  }
};

/**
 * Generate WhatsApp share URL with content
 */
export const getWhatsAppShareUrl = (content: string): string => {
  const textWithFooter = addShareFooter(content);
  return `https://wa.me/?text=${encodeURIComponent(textWithFooter)}`;
};

/**
 * Generate Email share URL with content
 */
export const getEmailShareUrl = (subject: string, content: string): string => {
  const textWithFooter = addShareFooter(content);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textWithFooter)}`;
};

/**
 * Copy content to clipboard with footer
 */
export const copyToClipboard = async (content: string): Promise<boolean> => {
  const textWithFooter = addShareFooter(content);
  try {
    await navigator.clipboard.writeText(textWithFooter);
    return true;
  } catch {
    return false;
  }
};
