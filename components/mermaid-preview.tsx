"use client";
import { Mermaid, type MermaidConfig } from "@/components/mermaid";
import { ZoomPan } from "@/components/zoom-pan";
import { Button } from "@/components/ui/button";
import {
  DownloadIcon,
  CopyIcon,
  ZoomInIcon,
  ZoomOutIcon,
  LocateFixedIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MermaidPreviewProps {
  chart: string;
  config: MermaidConfig;
  svgOutput: string;
  onSvgOutputChange: (svg: string) => void;
  className?: string;
}

export function MermaidPreview({
  chart,
  config,
  svgOutput,
  onSvgOutputChange,
  className,
}: MermaidPreviewProps) {
  const handleCopySvg = async () => {
    if (svgOutput) {
      await navigator.clipboard.writeText(svgOutput);
    }
  };

  const handleExportSvg = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mermaid-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!svgOutput) return;
    const svgBlob = new Blob([svgOutput], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = "mermaid-diagram.png";
            a.click();
            URL.revokeObjectURL(pngUrl);
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <ZoomPan
      className={cn("min-h-0", className)}
      controls={({ zoomIn, zoomOut, resetZoom, centerView, scalePercent }) => (
        <div className="bg-muted/50 border-border flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Preview
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={zoomOut}
              title="Zoom out"
              disabled={!svgOutput}
            >
              <ZoomOutIcon className="h-3 w-3" />
              <span className="sr-only">Zoom out</span>
            </Button>
            <button
              onClick={resetZoom}
              className="text-muted-foreground hover:text-foreground min-w-[3rem] px-1 text-center text-[10px] font-medium tabular-nums transition-colors"
              title="Reset zoom"
              disabled={!svgOutput}
            >
              {scalePercent}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={zoomIn}
              title="Zoom in"
              disabled={!svgOutput}
            >
              <ZoomInIcon className="h-3 w-3" />
              <span className="sr-only">Zoom in</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={centerView}
              title="Fit to center"
              disabled={!svgOutput}
            >
              <LocateFixedIcon className="h-3 w-3" />
              <span className="sr-only">Fit to center</span>
            </Button>

            <div className="bg-border mx-1 h-4 w-px" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopySvg}
              title="Copy SVG"
              disabled={!svgOutput}
            >
              <CopyIcon className="h-3 w-3" />
              <span className="sr-only">Copy SVG</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleExportSvg}
              title="Export SVG"
              disabled={!svgOutput}
            >
              <DownloadIcon className="h-3 w-3" />
              <span className="sr-only">Export SVG</span>
            </Button>
            <Button
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={handleExportPng}
              disabled={!svgOutput}
              title="Export PNG"
            >
              PNG
            </Button>
          </div>
        </div>
      )}
    >
      <Mermaid
        chart={chart}
        config={config}
        className="h-full w-full"
        onSuccess={onSvgOutputChange}
        onError={() => onSvgOutputChange("")}
      />
    </ZoomPan>
  );
}
