# mermaidcn

A customizable, shadcn-compatible Mermaid.js renderer for React with built-in zoom and pan. Copy. Paste. Render.

Built with [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), and [Mermaid.js](https://mermaid.js.org/).

## Features

- **🚀 shadcn/ui compatible**: Easy installation via the CLI or manual copy-paste.
- **🔍 Built-in Zoom & Pan**: Fluid interaction for complex diagrams.
- **🎨 Theming support**: Built-in support for multiple Mermaid themes plus custom oklch-based themes.
- **⚡️ Performance**: Dynamic imports and debounced rendering for a smooth experience.
- **🎮 Mermaid Playground**: A full editor and preview environment out of the box.

## Components

### `<Mermaid />`

Pure renderer component for Mermaid diagrams. Handles loading, error states, and dynamic imports automatically.

### `<ZoomPan />`

Generic zoom and pan wrapper. Wraps any React content (not just Mermaid) in a scrollable, pannable, pinch-zoomable canvas.

### `<MermaidPlayground />`

A complete Mermaid editor and preview environment. Includes theme selection, templates, and live editing.

## Installation

### Via shadcn CLI

```bash
# Install Mermaid Renderer
npx shadcn@latest add https://mermaidcn.vercel.app/r/mermaid.json https://mermaidcn.vercel.app/r/mermaid-themes.json

# Install ZoomPan Wrapper
npx shadcn@latest add https://mermaidcn.vercel.app/r/zoom-pan.json

# Install Mermaid Playground
npx shadcn@latest add https://mermaidcn.vercel.app/r/mermaid-playground.json
```

### Manual Installation

1. Install the `mermaid` dependency:

   ```bash
   npm install mermaid
   ```

2. Copy the component files into your project:
   ```text
   components/
     mermaidcn/
       mermaid.tsx      # Pure renderer
       zoom-pan.tsx     # Zoom & pan wrapper
       mermaid-playground.tsx # Full playground
   ```

## Quick Start

```tsx
import { Mermaid } from "@/components/mermaidcn/mermaid";

export function MyDiagram() {
  return (
    <Mermaid
      chart={`sequenceDiagram
        participant C as Client
        participant S as Server
        C->>S: POST /api/data
        S-->>C: 200 OK`}
    />
  );
}
```

## Documentation

For full documentation and examples, visit [mermaidcn.vercel.app](https://mermaidcn.vercel.app).

## License

MIT License. Built with shadcn/ui.
