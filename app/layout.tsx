import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "mermaidcn - Mermaid.js Renderer for React",
    template: "%s | mermaidcn",
  },
  description:
    "A customizable, shadcn-compatible Mermaid.js diagram renderer built with React. Features built-in zoom, pan, and a full playground environment.",
  keywords: [
    "Mermaid.js",
    "React",
    "shadcn/ui",
    "Diagrams",
    "Flowchart",
    "Sequence Diagram",
    "Component Library",
    "Next.js",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mermaidcn.vercel.app",
    title: "mermaidcn - Mermaid.js Renderer for React",
    description:
      "A customizable, shadcn-compatible Mermaid.js diagram renderer built with React. Features built-in zoom, pan, and a full playground environment.",
    siteName: "mermaidcn",
  },
  twitter: {
    card: "summary_large_image",
    title: "mermaidcn - Mermaid.js Renderer for React",
    description:
      "A customizable individual Mermaid.js components for React. Built with shadcn/ui.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
