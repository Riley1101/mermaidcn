import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LivePreviewProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  code?: string;
}

export function LivePreview({
  children,
  className,
  label,
  code,
}: LivePreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "border-border group relative overflow-hidden rounded-lg border",
        className,
      )}
    >
      {(label || code) && (
        <div className="border-border bg-muted/50 flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">
            {label}
          </span>
          {code && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Copy code</span>
            </Button>
          )}
        </div>
      )}
      <div className="bg-background p-4">{children}</div>
    </div>
  );
}
