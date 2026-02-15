"use client";

import * as React from "react";
import { codeToHtml } from "shiki";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
	code: string;
	language?: string;
	filename?: string;
	className?: string;
}

export function CodeBlock({
	code,
	language = "tsx",
	filename,
	className,
}: CodeBlockProps) {
	const [copied, setCopied] = React.useState(false);
	const [highlightedHtml, setHighlightedHtml] = React.useState<string>("");

	React.useEffect(() => {
		codeToHtml(code, {
			lang: language,
			themes: {
				light: "gruvbox-light-hard",
				dark: "kanagawa-wave",
			},
			defaultColor: false,
		}).then(setHighlightedHtml);
	}, [code, language]);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div
			className={cn(
				"border-border bg-muted/50 group relative overflow-hidden rounded-lg border",
				className,
			)}
		>
			{filename && (
				<div className="border-border flex items-center justify-between border-b px-4 py-2">
					<span className="text-muted-foreground font-mono text-xs">
						{filename}
					</span>
					{language && (
						<span className="text-muted-foreground text-[10px] uppercase tracking-wider">
							{language}
						</span>
					)}
				</div>
			)}
			<div className="relative">
				{highlightedHtml ? (
					<div
						className="[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:!bg-transparent [&_code]:font-mono [&_code]:text-[13px] [&_code]:leading-relaxed"
						dangerouslySetInnerHTML={{ __html: highlightedHtml }}
					/>
				) : (
					<pre className="overflow-x-auto p-4">
						<code className="text-foreground font-mono text-[13px] leading-relaxed">
							{code}
						</code>
					</pre>
				)}
				<button
					onClick={handleCopy}
					className="bg-muted hover:bg-accent text-muted-foreground hover:text-foreground absolute right-2 top-2 rounded-md border p-1.5 opacity-0 transition-all group-hover:opacity-100"
					aria-label="Copy code"
				>
					{copied ? (
						<CheckIcon className="h-3.5 w-3.5" />
					) : (
						<CopyIcon className="h-3.5 w-3.5" />
					)}
				</button>
			</div>
		</div>
	);
}
