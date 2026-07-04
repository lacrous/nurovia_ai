import { useEffect } from "react";

const BASE_TITLE = "Nurovia AI";
const SUFFIX = " · Nurovia AI";

/**
 * Sets `document.title` to `${title} · Nurovia AI` on mount, restores previous on unmount.
 * Pass `null` for the home page (uses just the base title).
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    const prev = document.title;
    if (!title) {
      document.title = BASE_TITLE + " (beta) — Multi-model AI council";
    } else {
      document.title = `${title}${SUFFIX}`;
    }
    return () => {
      document.title = prev;
    };
  }, [title]);
}