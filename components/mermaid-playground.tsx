"use client";

import * as React from "react";
import { MermaidEditor } from "@/components/mermaid-editor";
import { MermaidPreview } from "@/components/mermaid-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type MermaidConfig,
  type MermaidBuiltinTheme,
} from "@/components/mermaid";
import { diagramTemplates } from "@/lib/diagram-templates";
import { mermaidThemes, type MermaidCustomTheme } from "@/lib/mermaid-themes";
import { useTheme } from "next-themes";

const THEMES: { label: string; value: string; color: string }[] = [
  { label: "Default", value: "default", color: "#6366f1" },
  { label: "Neutral", value: "neutral", color: "#737373" },
  { label: "Dark", value: "dark", color: "#1e293b" },
  { label: "Forest", value: "forest", color: "#10b981" },
  { label: "Base", value: "base", color: "#f43f5e" },
  ...Object.entries(mermaidThemes).map(([key, theme]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
    color: theme.primaryColor,
  })),
];

interface MermaidPlaygroundProps {
  defaultValue?: string;
  className?: string;
}

export function MermaidPlayground({
  defaultValue,
  className,
}: MermaidPlaygroundProps) {
  const [code, setCode] = React.useState(
    defaultValue || diagramTemplates[0].chart,
  );
  const [theme, setTheme] = React.useState<string>("default");
  const [look, setLook] = React.useState<"classic" | "handdrawn">("classic");
  const [svgOutput, setSvgOutput] = React.useState<string>("");

  const { resolvedTheme: siteTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const darkMode = mounted && siteTheme === "dark";

  // Config object for Mermaid
  const config = React.useMemo<MermaidConfig>(() => {
    const isCustomTheme = ![
      "default",
      "neutral",
      "dark",
      "forest",
      "base",
    ].includes(theme);
    return {
      theme: isCustomTheme ? "base" : (theme as MermaidBuiltinTheme),
      darkMode,
      look,
      themeVariables: isCustomTheme
        ? mermaidThemes[theme as MermaidCustomTheme]
        : undefined,
    };
  }, [theme, look, darkMode]);

  const handleTemplateChange = (templateId: string) => {
    const template = diagramTemplates.find((t) => t.id === templateId);
    if (template) {
      setCode(template.chart);
    }
  };

  return (
    <div
      className={cn(
        "bg-background border-border flex flex-col overflow-hidden rounded-xl border shadow-sm",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="bg-muted/30 border-border flex flex-wrap items-center justify-between gap-4 border-b p-3">
        <div className="flex items-center gap-2">
          <Select
            defaultValue={diagramTemplates[0].id}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {diagramTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Look Toggle */}
          <Tabs
            value={look}
            onValueChange={(v: string) => setLook(v as "classic" | "handdrawn")}
            className="h-8"
          >
            <TabsList className="h-8">
              <TabsTrigger value="classic" className="px-2 text-xs">
                Classic
              </TabsTrigger>
              <TabsTrigger value="handdrawn" className="px-2 text-xs">
                Handdrawn
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Theme Select */}
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: THEMES.find((t) => t.value === theme)
                      ?.color,
                  }}
                />
                <SelectValue placeholder="Theme" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content: Editor + Preview */}
      <div className="flex min-h-[500px] flex-col h-[500px] md:flex-row">
        {/* Editor */}
        <div className="border-border min-h-[300px] w-full border-b md:h-full md:w-1/2 md:border-b-0 md:border-r">
          <MermaidEditor
            value={code}
            onChange={setCode}
            className="h-full w-full bg-transparent"
          />
        </div>

        {/* Preview */}
        <div className="min-h-[300px] w-full bg-muted/5 md:h-full md:w-1/2">
          <MermaidPreview
            chart={code}
            config={config}
            svgOutput={svgOutput}
            onSvgOutputChange={setSvgOutput}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
