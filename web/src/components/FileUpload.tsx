import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, X, FileText, Image as ImageIcon, FileCode } from "lucide-react";
import type { ContentPart } from "../services/api";

export interface PendingAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** Base64 (without data: prefix). */
  base64: string;
  /** Text preview for non-image files. */
  textPreview?: string;
  /** Object URL for image thumbnails. */
  previewUrl?: string;
}

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const TEXT_MIMES = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-yaml",
];

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function isImageMime(mime: string): boolean {
  return IMAGE_MIMES.includes(mime);
}

export function isTextMime(mime: string): boolean {
  if (TEXT_MIMES.some((t) => mime.startsWith(t))) return true;
  if (mime === "application/octet-stream" && /\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|hpp|cs|rb|php|sh|bash|sql|md|markdown|json|ya?ml|toml|ini|cfg|env|html|css|scss|sass|vue|svelte|kt|swift|dart)$/i.test("")) return true;
  return false;
}

export function fileIconFor(mime: string, name: string) {
  if (isImageMime(mime)) return ImageIcon;
  if (isTextMime(mime) || /\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|rb|php|sh|sql|md|json|html|css)$/i.test(name)) {
    return FileCode;
  }
  return FileText;
}

export async function readFile(file: File): Promise<PendingAttachment | null> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max 8 MB)`);
  }
  const dataUrl = await readAsDataUrl(file);
  const base64 = dataUrl.split(",", 2)[1] ?? "";
  const isImage = isImageMime(file.type);
  let textPreview: string | undefined;
  let previewUrl: string | undefined;
  if (isImage) {
    previewUrl = URL.createObjectURL(file);
  } else if (isTextMime(file.type)) {
    try {
      textPreview = await readAsText(file);
      if (textPreview.length > 60_000) {
        textPreview = textPreview.slice(0, 60_000) + "\n…(truncated)";
      }
    } catch {
      textPreview = "(could not read as text)";
    }
  }
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    base64,
    textPreview,
    previewUrl,
  };
}

export function attachmentsToContentParts(attachments: PendingAttachment[]): ContentPart[] {
  const parts: ContentPart[] = [];
  for (const a of attachments) {
    if (isImageMime(a.mime)) {
      parts.push({
        type: "image_url",
        image_url: { url: `data:${a.mime};base64,${a.base64}` },
      });
      parts.push({ type: "text", text: `[Attached image: ${a.name}]` });
    } else {
      parts.push({
        type: "file",
        name: a.name,
        mime: a.mime,
        data: a.base64,
        textPreview: a.textPreview,
      });
    }
  }
  return parts;
}

interface FileUploadProps {
  attachments: PendingAttachment[];
  onChange: (next: PendingAttachment[]) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  /**
   * inline: render a compact Paperclip icon that opens the file picker.
   * Otherwise a full drag-drop zone is rendered above the textarea.
   */
  inline?: boolean;
}

export function FileUpload({
  attachments,
  onChange,
  onError,
  disabled,
  inline = false,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      const next: PendingAttachment[] = [...attachments];
      for (const file of list) {
        try {
          const att = await readFile(file);
          if (att) next.push(att);
        } catch (err) {
          onError?.(err instanceof Error ? err.message : String(err));
        }
      }
      onChange(next);
    },
    [attachments, onChange, onError]
  );

  const remove = (id: string) => {
    const target = attachments.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {attachments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex flex-wrap gap-2"
        >
          {attachments.map((a) => {
            const Icon = fileIconFor(a.mime, a.name);
            return (
              <div
                key={a.id}
                className="group flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-surface border border-theme/30 text-[11px]"
                title={`${a.name} · ${(a.size / 1024).toFixed(1)} KB`}
              >
                {a.previewUrl ? (
                  <img
                    src={a.previewUrl}
                    alt=""
                    className="w-6 h-6 rounded-md object-cover border border-theme/30"
                  />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-gold" />
                )}
                <span className="max-w-[160px] truncate txt-body">{a.name}</span>
                <button
                  onClick={() => remove(a.id)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </motion.div>
      )}

      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`${inline ? "hidden" : "hidden md:flex"} items-center justify-center gap-2 mb-2 px-3 py-2 rounded-xl border border-dashed text-[11px] cursor-pointer transition-colors ${
          disabled
            ? "border-theme/20 txt-faint cursor-not-allowed"
            : dragging
            ? "border-gold bg-gold/5 txt-gold"
            : "border-theme/30 txt-muted hover:border-gold/40 hover:text-gold"
        }`}
      >
        <Paperclip className="w-3.5 h-3.5" />
        <span>
          {dragging
            ? "Drop files here"
            : "Drag & drop files, or click to attach images, code, or docs"}
        </span>
      </div>

      {/* whole-container drop target — works in both inline and full mode */}
      {inline && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Attach files"
          className="p-2 rounded-xl text-muted-foreground hover:bg-background hover:text-gold transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}