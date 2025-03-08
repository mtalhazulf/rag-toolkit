import { Metadata } from 'next';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
};

export function constructMetadata({
  title = 'Text Chunking & RAG System',
  description = 'A powerful tool for text chunking and retrieval-augmented generation with GPT models',
  keywords = ['text chunking', 'RAG', 'embeddings', 'AI', 'GPT', 'NLP'],
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex = false,
}: SeoProps = {}): Metadata {
  // Generate dynamic OG image URL if not provided
  const ogImageUrl = ogImage || `/api/og?title=${encodeURIComponent(title)}`;
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
    creator: 'Your Name',
    publisher: 'Your Company',
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    metadataBase: new URL('https://your-domain.com'),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: ogType,
      url: canonicalUrl,
      siteName: 'Text Chunking & RAG System',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImageUrl],
      creator: '@yourtwitter',
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    other: {
      'theme-color': '#ffffff',
    },
  };
}

export default constructMetadata;