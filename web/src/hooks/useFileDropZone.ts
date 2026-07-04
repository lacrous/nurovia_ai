import { useEffect, useRef, useState } from "react";
import type { PendingAttachment } from "../components/FileUpload";
import { readFile } from "../components/FileUpload";

/**
 * Tracks drag state and provides onDrop handler for a drop target.
 * Filters out non-file drags (text, urls) so the browser's default drop behavior remains intact.
 */
export function useFileDropZone(opts: {
  onFiles: (next: PendingAttachment[]) => void;
  disabled?: boolean;
}) {
  const { onFiles, disabled } = opts;
  const [dragging, setDragging] = useState(false);
  const depthRef = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const hasFile = (e: DragEvent) =>
      e.dataTransfer?.types ? Array.from(e.dataTransfer.types).includes("Files") : false;
    const onEnter = (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      depthRef.current += 1;
      setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current <= 0) setDragging(false);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = async (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      depthRef.current = 0;
      setDragging(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const next: PendingAttachment[] = [];
      for (const file of Array.from(files)) {
        try {
          const att = await readFile(file);
          if (att) next.push(att);
        } catch {
          // swallow per-file errors at the zone level; UI shows them via FileUpload prop
        }
      }
      if (next.length > 0) onFiles(next);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFiles, disabled]);

  return { dragging };
}