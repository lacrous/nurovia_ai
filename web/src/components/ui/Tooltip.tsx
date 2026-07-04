import { useState } from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  side?: "right" | "left" | "top" | "bottom";
}

export function Tooltip({ children, text, side = "right" }: TooltipProps) {
  const [show, setShow] = useState(false);

  const sideClasses = {
    right: "left-full ml-2.5",
    left: "right-full mr-2.5",
    top: "bottom-full mb-2.5",
    bottom: "top-full mt-2.5",
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`absolute ${sideClasses[side]} px-2 py-1 rounded-md bg-surface border border-theme shadow-md text-[10px] font-medium whitespace-nowrap z-[70] text-foreground`}
        >
          {text}
        </span>
      )}
    </div>
  );
}
