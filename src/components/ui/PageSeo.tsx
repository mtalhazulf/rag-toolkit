import React from 'react';
import Head from 'next/head';
import JsonLd from './JsonLd';

interface PageSeoProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

export default function PageSeo({
  title = 'Text Chunking & RAG System',
  description = 'A powerful tool for text chunking and retrieval-augmented generation with GPT models',
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  structuredData,
}: PageSeoProps) {
  // Generate dynamic OG image URL if not provided
  const ogImageUrl = ogImage || `/api/og?title=${encodeURIComponent(title)}`;
  
  // Construct the full title with site name
  const fullTitle = `${title} | Text Chunking & RAG System`;
  
  return (
    <>
      {structuredData && <JsonLd data={structuredData} />}
      
      <Head>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {noIndex && <meta name="robots" content="noindex, nofollow" />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Text Chunking & RAG System" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:creator" content="@yourtwitter" />
      </Head>
    </>
  );
}