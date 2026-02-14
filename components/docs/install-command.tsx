"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstallCommandProps {
  command: string
  className?: string
}

export function InstallCommand({ command, className }: InstallCommandProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "bg-muted text-foreground border border-border group flex w-full max-w-xl items-center gap-3 rounded-lg px-4 py-3 font-mono text-sm transition-opacity hover:opacity-90",
        className
      )}
    >
      <TerminalIcon className="h-4 w-4 shrink-0 opacity-60" />
      <span className="flex-1 truncate text-left">{command}</span>
      {copied ? (
        <CheckIcon className="h-4 w-4 shrink-0 opacity-60" />
      ) : (
        <CopyIcon className="h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  )
}
