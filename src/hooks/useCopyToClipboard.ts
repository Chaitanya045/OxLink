import { useCallback } from "react";
import { toast } from "sonner";

interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
}

export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${text} copied to clipboard`);
      return true;
    } catch {
      toast.error("Failed to copy URL");
      return false;
    }
  }, []);

  return { copy };
}
