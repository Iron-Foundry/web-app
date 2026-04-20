import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SvgIconProps {
  /** URL or imported asset path to an SVG file */
  src: string;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

/**
 * Loads an SVG file and renders it inline so it can be styled with CSS
 * (e.g. currentColor, Tailwind color/size utilities).
 *
 * Usage:
 *   import icon from "@/assets/my-icon.svg";
 *   <SvgIcon src={icon} className="h-5 w-5 text-primary" />
 */
export function SvgIcon({
  src,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: SvgIconProps) {
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!markup) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full",
        className,
      )}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? !ariaLabel}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
