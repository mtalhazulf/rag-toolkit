import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Chunking & RAG System - Process and Analyze Text',
  description: 'Process text into semantic chunks and use retrieval-augmented generation to analyze and query your content',
  keywords: ['text chunking', 'RAG', 'embeddings', 'semantic search', 'GPT', 'NLP', 'text processing'],
  openGraph: {
    title: 'Text Chunking & RAG System - Process and Analyze Text',
    description: 'Process text into semantic chunks and use retrieval-augmented generation to analyze and query your content',
    images: [
      {
        url: '/api/og?title=Text+Chunking+%26+RAG+System',
        width: 1200,
        height: 630,
        alt: 'Text Chunking & RAG System',
      },
    ],
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 