import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { constructMetadata } from "@/components/ui/Seo";
import JsonLd, { generateWebsiteSchema, generateSoftwareApplicationSchema } from "@/components/ui/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = constructMetadata({
  title: "Text Chunking & RAG System",
  description: "A powerful tool for text chunking and retrieval-augmented generation with GPT models",
  keywords: ["text chunking", "RAG", "embeddings", "AI", "GPT", "NLP", "text processing", "semantic search"],
  ogImage: "/og-image.png",
  ogType: "website",
  twitterCard: "summary_large_image",
  canonicalUrl: "https://your-domain.com",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateWebsiteSchema(
    "Text Chunking & RAG System",
    "https://your-domain.com",
    "A powerful tool for text chunking and retrieval-augmented generation with GPT models"
  );

  const softwareSchema = generateSoftwareApplicationSchema(
    "Text Chunking & RAG System",
    "A powerful tool for text chunking and retrieval-augmented generation with GPT models",
    "https://your-domain.com",
    "DeveloperApplication",
    "Web"
  );

  return (
    <html lang="en">
      <head>
        <JsonLd data={websiteSchema} />
        <JsonLd data={softwareSchema} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
