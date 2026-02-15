"use client";

import * as React from "react";
import { Mermaid } from "@/components/mermaid";
import { ZoomPan } from "@/components/zoom-pan";
import { CodeBlock } from "@/components/docs/code-block";
import { PropsTable } from "@/components/docs/props-table";
import { LivePreview } from "@/components/docs/live-preview";
import { MermaidPlayground } from "@/components/mermaid-playground";
import { InstallCommand } from "@/components/docs/install-command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GitBranchIcon,
  ExternalLinkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  LocateFixedIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

const mermaidProps = [
  {
    name: "chart",
    type: "string",
    description: "The Mermaid diagram definition string to render.",
    required: true,
  },
  {
    name: "config",
    type: "MermaidConfig",
    description:
      "Configuration object for theming, fonts, and diagram-specific options.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes for the container element.",
  },
  {
    name: "onSuccess",
    type: "(svg: string) => void",
    description: "Callback fired with the rendered SVG string on success.",
  },
  {
    name: "onError",
    type: "(error: string) => void",
    description: "Callback fired with the error message on render failure.",
  },
  {
    name: "debounceTime",
    type: "number",
    default: "300",
    description:
      "Delay in ms before rendering triggers (useful for live editors).",
  },
];

const zoomPanProps = [
  {
    name: "imageSrc",
    type: "string",
    description:
      "The source URL or Data URL of the image to render on the canvas.",
    required: true,
  },
  {
    name: "onLoad",
    type: "() => void",
    description: "Callback fired when the image successfully loads.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    description:
      "Optional content rendered in a hidden container (useful for lifecycle management).",
  },
  {
    name: "controls",
    type: "(api) => ReactNode",
    description:
      "Render-prop exposing zoomIn, zoomOut, resetZoom, centerView, and scalePercent.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes for the outer wrapper.",
  },
  {
    name: "minScale",
    type: "number",
    default: "0.1",
    description: "Minimum zoom scale.",
  },
  {
    name: "maxScale",
    type: "number",
    default: "5",
    description: "Maximum zoom scale.",
  },
  {
    name: "initialScale",
    type: "number",
    default: "1",
    description: "Initial zoom scale on mount.",
  },
  {
    name: "zoomStep",
    type: "number",
    default: "0.1",
    description: "Scale increment per scroll tick.",
  },
  {
    name: "isLoading",
    type: "boolean",
    default: "false",
    description: "Whether the component is in a loading state.",
  },
  {
    name: "loadingFallback",
    type: "React.ReactNode",
    description: "Custom UI to show during the loading state.",
  },
];

const playgroundProps = [
  {
    name: "defaultValue",
    type: "string",
    description: "Initial Mermaid diagram code for the editor.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes for the container.",
  },
];

const previewProps = [
  {
    name: "chart",
    type: "string",
    description: "The Mermaid diagram definition string.",
    required: true,
  },
  {
    name: "config",
    type: "MermaidConfig",
    description: "Configuration object for rendering.",
  },
  {
    name: "svgOutput",
    type: "string",
    description: "The rendered SVG string (controlled state).",
    required: true,
  },
  {
    name: "onSvgOutputChange",
    type: "(svg: string) => void",
    description: "Callback called when the SVG is successfully rendered.",
    required: true,
  },
  {
    name: "className",
    type: "string",
    description: "Additional CSS classes for the preview wrapper.",
  },
];

const BASIC_EXAMPLE = `import { Mermaid } from "@/components/mermaidcn/mermaid"

export function MyDiagram() {
  return (
    <Mermaid
      chart={\`sequenceDiagram
        participant C as Client
        participant S as Server
        C->>S: POST /api/data
        S-->>C: 200 OK\`}
    />
  )
}`;

const THEMED_EXAMPLE = `import { Mermaid } from "@/components/mermaidcn/mermaid"

export function ThemedDiagram() {
  return (
    <Mermaid
      chart={\`flowchart LR
        A([Input]) --> B[Process]
        B --> C([Output])\`}
      config={{
        theme: "forest",
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
      }}
    />
  )
}`;

const ZOOM_EXAMPLE = `import { Mermaid } from "@/components/mermaidcn/mermaid"
import { ZoomPan } from "@/components/mermaidcn/zoom-pan"

export function ZoomableDiagram() {
  const [svgOutput, setSvgOutput] = React.useState("")

  const imageSrc = React.useMemo(() => {
    if (!svgOutput) return ""
    const bytes = new TextEncoder().encode(svgOutput)
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
    return \`data:image/svg+xml;base64,\${btoa(binString)}\`
  }, [svgOutput])

  return (
    <ZoomPan
      imageSrc={imageSrc}
      className="h-[400px]"
      controls={({ zoomIn, zoomOut, resetZoom, scalePercent }) => (
        <div className="flex items-center gap-2 p-2">
          <button onClick={zoomOut}>-</button>
          <span>{scalePercent}%</span>
          <button onClick={zoomIn}>+</button>
          <button onClick={resetZoom}>Reset</button>
        </div>
      )}
    >
      <Mermaid 
        chart="classDiagram\\n  class Animal" 
        onSuccess={setSvgOutput}
      />
    </ZoomPan>
  )
}`;

const HOOK_EXAMPLE = `import { useZoomPan } from "@/components/mermaidcn/zoom-pan"

export function CustomZoom() {
  const { zoomIn, zoomOut, resetZoom, scalePercent } = useZoomPan()

  return (
    <div>
      <p>Current zoom: {scalePercent}%</p>
      <button onClick={zoomIn}>Zoom In</button>
      <button onClick={zoomOut}>Zoom Out</button>
      <button onClick={resetZoom}>Reset</button>
    </div>
  )
}`;

const PLAYGROUND_EXAMPLE = `import { MermaidPlayground } from "@/components/mermaidcn/mermaid-playground"

export function Editor() {
  return (
    <MermaidPlayground 
      defaultValue="graph TD; A-->B;" 
      className="h-[500px]" 
    />
  )
}`;

const PREVIEW_EXAMPLE = `import { MermaidPreview } from "@/components/mermaidcn/mermaid-preview"

export function CustomPreview() {
  const [svg, setSvg] = React.useState("")
  
  return (
    <MermaidPreview
      chart="graph TD; A-->B;"
      config={{ theme: 'dark' }}
      svgOutput={svg}
      onSvgOutputChange={setSvg}
    />
  )
}`;

export function DocsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="bg-background/80 mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-foreground flex h-7 w-7 items-center justify-center rounded-md">
              <GitBranchIcon className="text-background h-4 w-4" />
            </div>
            <span className="text-foreground text-sm font-semibold tracking-tight">
              mermaidcn
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="#components"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Components
            </a>
            <a
              href="#installation"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Install
            </a>
            <a
              href="https://github.com/Riley1101/mermaidcn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              GitHub
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono text-xs">
                v0.1.0
              </Badge>
              <span className="text-muted-foreground text-xs">
                shadcn/ui compatible
              </span>
            </div>
            <h1 className="text-foreground text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Mermaid diagrams
              <br />
              <span className="text-muted-foreground">for React</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
              A customizable, shadcn-compatible Mermaid.js renderer with
              built-in zoom and pan. Copy. Paste. Render.
            </p>
          </div>
          <div className="mt-8 border-border overflow-hidden rounded-xl border shadow-2xl">
            <MermaidPlayground />
          </div>
        </section>

        <Separator />

        {/* Mermaid Component */}
        <section id="components" className="py-16">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  {"<Mermaid />"}
                </h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  component
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Pure renderer component. Pass a Mermaid chart string and an
                optional config, get a rendered SVG. Handles loading, error
                states, and dynamic imports automatically.
              </p>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Props
              </h3>
              <PropsTable props={mermaidProps} />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Basic Usage
              </h3>
              <CodeBlock code={BASIC_EXAMPLE} filename="my-diagram.tsx" />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Preview
              </h3>
              <LivePreview label="Basic Mermaid" code={BASIC_EXAMPLE}>
                <Mermaid
                  chart={`sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: POST /api/data
    S-->>C: 200 OK`}
                  className="flex items-center justify-center"
                />
              </LivePreview>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                With Theming
              </h3>
              <CodeBlock code={THEMED_EXAMPLE} filename="themed-diagram.tsx" />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Preview
              </h3>
              <LivePreview label="Forest Theme" code={THEMED_EXAMPLE}>
                <Mermaid
                  chart={`flowchart LR
    A([Input]) --> B[Process]
    B --> C([Output])`}
                  config={{
                    theme: "forest",
                    fontSize: 16,
                    fontFamily: "Inter, sans-serif",
                  }}
                  className="flex items-center justify-center"
                />
              </LivePreview>
            </div>
          </div>
        </section>

        <Separator />

        {/* ZoomPan Component */}
        <section className="py-16">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  {"<ZoomPan />"}
                </h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  component
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                High-performance canvas-based zoom and pan engine. Optimized for
                large images and complex diagrams with smooth interpolation and
                high-DPI support. For Mermaid diagrams, using{" "}
                {"<MermaidPreview />"} is recommended as it handles the
                SVG-to-Canvas conversion automatically.
              </p>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Props
              </h3>
              <PropsTable props={zoomPanProps} />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Wrapping Mermaid in ZoomPan
              </h3>
              <CodeBlock code={ZOOM_EXAMPLE} filename="zoomable-diagram.tsx" />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Preview
              </h3>
              <LivePreview
                label="Zoom & Pan (scroll to zoom, drag to pan)"
                code={ZOOM_EXAMPLE}
              >
                <ZoomPanDemo />
              </LivePreview>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                useZoomPan Hook
              </h3>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                For fully custom implementations, use the{" "}
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  useZoomPan
                </code>{" "}
                hook to get zoom state and control functions without the wrapper
                component.
              </p>
              <CodeBlock code={HOOK_EXAMPLE} filename="custom-zoom.tsx" />
            </div>
          </div>
        </section>

        <Separator />

        {/* MermaidPlayground Component */}
        <section className="py-16">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  {"<MermaidPlayground />"}
                </h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  component
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                The full batteries-included playground environment. Combines the
                editor, controls, and preview into a single cohesive interface.
              </p>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Props
              </h3>
              <PropsTable props={playgroundProps} />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Usage
              </h3>
              <CodeBlock
                code={PLAYGROUND_EXAMPLE}
                filename="my-playground.tsx"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* MermaidPreview Component */}
        <section className="py-16">
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  {"<MermaidPreview />"}
                </h2>
                <Badge variant="outline" className="font-mono text-[10px]">
                  component
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                A standalone component that wraps the Renderer and ZoomPan
                features along with export controls (SVG, PNG, Copy). This is
                the component used within the Playground.
              </p>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Props
              </h3>
              <PropsTable props={previewProps} />
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Usage
              </h3>
              <CodeBlock code={PREVIEW_EXAMPLE} filename="custom-preview.tsx" />
            </div>
          </div>
        </section>

        <Separator />

        {/* Installation */}
        <section id="installation" className="py-16">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight">
                Installation
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Install individual components via the shadcn CLI, or copy the
                source files directly.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-foreground mb-2 text-sm font-semibold">
                  Mermaid Renderer
                </h3>
                <InstallCommand command="npx shadcn@latest add https://mermaidcn.vercel.app/r/mermaid.json https://mermaidcn.vercel.app/r/mermaid-themes.json" />
              </div>
              <div>
                <h3 className="text-foreground mb-2 text-sm font-semibold">
                  ZoomPan Wrapper
                </h3>
                <InstallCommand command="npx shadcn@latest add https://mermaidcn.vercel.app/r/zoom-pan.json" />
              </div>
              <div>
                <h3 className="text-foreground mb-2 text-sm font-semibold">
                  Mermaid Playground
                </h3>
                <InstallCommand command="npx shadcn@latest add https://mermaidcn.vercel.app/r/mermaid-playground.json" />
              </div>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold">
                Manual Installation
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    1. Install the mermaid dependency:
                  </p>
                  <CodeBlock code="npm install mermaid" language="bash" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    2. Copy the component files into your project:
                  </p>
                  <CodeBlock
                    code={`components/
  mermaidcn/
    mermaid.tsx      # Pure renderer
    zoom-pan.tsx     # Zoom & pan wrapper`}
                    language="text"
                  />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    3. Import and use:
                  </p>
                  <CodeBlock code={BASIC_EXAMPLE} filename="example.tsx" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-border border-t">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <span className="text-muted-foreground text-xs">
            MIT License. Built with shadcn/ui.
          </span>
          <a
            href="https://github.com/Riley1101/mermaidcn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function ZoomPanDemo() {
  const [svgOutput, setSvgOutput] = React.useState<string>("");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const imageSrc = React.useMemo(() => {
    if (!svgOutput) return "";

    const bytes = new TextEncoder().encode(svgOutput);
    const binString = Array.from(bytes, (byte) =>
      String.fromCharCode(byte),
    ).join("");
    const base64 = btoa(binString);

    return `data:image/svg+xml;base64,${base64}`;
  }, [svgOutput]);

  return (
    <ZoomPan
      imageSrc={imageSrc}
      className="h-[350px] w-full"
      controls={({ zoomIn, zoomOut, resetZoom, centerView, scalePercent }) => (
        <div className="border-border flex items-center gap-1 border-b px-3 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
          >
            <ZoomOutIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom out</span>
          </Button>
          <button
            onClick={resetZoom}
            className="text-muted-foreground hover:text-foreground min-w-12 px-1 text-center text-xs font-medium tabular-nums transition-colors"
          >
            {scalePercent}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
          >
            <ZoomInIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom in</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={centerView}
          >
            <LocateFixedIcon className="h-3.5 w-3.5" />
            <span className="sr-only">Reset zoom</span>
          </Button>
        </div>
      )}
    >
      <Mermaid
        config={{
          darkMode: mounted && resolvedTheme === "dark",
        }}
        chart={`classDiagram
            class User {
                +String name
                +String email
                +login()
                +logout()
            }
            class Post {
                +String title
                +String content
                +publish()
            }
            class Comment {
                +String body
                +Date createdAt
                +edit()
            }
            User "1" --> "*" Post : writes
            Post "1" --> "*" Comment : has
            User "1" --> "*" Comment : makes`}
        onSuccess={setSvgOutput}
        className="w-full h-full"
      />
    </ZoomPan>
  );
}
