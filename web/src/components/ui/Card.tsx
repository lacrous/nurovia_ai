import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isInteractive?: boolean;
  isActive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ isInteractive, isActive, children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border bg-panel/40 p-6 transition-colors ${
          isActive
            ? "border-gold/40 bg-gold/5"
            : isInteractive
            ? "border-theme/20 hover:border-gold/30 hover:bg-panel/60 cursor-pointer"
            : "border-theme/20"
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
