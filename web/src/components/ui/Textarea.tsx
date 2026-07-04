import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`w-full rounded-xl bg-surface border border-theme/30 text-[14px] placeholder:text-muted-foreground/50 focus:border-gold/50 focus:ring-2 focus:ring-gold/10 outline-none transition-all px-4 py-3 resize-none ${
            error ? "border-red-500/50 focus:border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-red-400 mt-1.5">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
