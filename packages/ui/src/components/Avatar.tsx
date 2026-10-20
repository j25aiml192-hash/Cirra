import * as React from "react";
import { cn } from "../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export function Avatar({
  className,
  src,
  alt = "",
  fallback = "CR",
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(!src);

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 items-center justify-center font-medium text-xs text-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}
