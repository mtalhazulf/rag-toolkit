# SEO Implementation Guide

This document outlines the SEO implementation for the Text Chunking & RAG System project.

## Overview

The SEO implementation includes:

1. Metadata configuration using Next.js App Router
2. OpenGraph and Twitter card metadata
3. JSON-LD structured data
4. Dynamic OG image generation
5. Sitemap generation
6. Robots.txt configuration

## Components

### 1. SEO Component

Located at `src/components/ui/Seo.tsx`, this component provides a centralized way to define metadata for the entire application. It includes:

- Basic metadata (title, description, keywords)
- OpenGraph metadata
- Twitter card metadata
- Canonical URL support
- Robots directives

### 2. JSON-LD Component

Located at `src/components/ui/JsonLd.tsx`, this component allows for adding structured data to pages. It includes helper functions for:

- Website schema
- Organization schema
- SoftwareApplication schema

### 3. Dynamic OG Image Generation

Located at `src/app/api/og/route.tsx`, this API route generates dynamic Open Graph images based on page titles.

## Usage

### Application-wide SEO

The base SEO configuration is defined in `src/app/layout.tsx` using the `constructMetadata` function.

### Page-specific SEO

Each page can define its own metadata by exporting a `metadata` object:

```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  // Other metadata
};
```

### Structured Data

To add structured data to a page:

```tsx
import JsonLd, { generateWebsiteSchema } from '@/components/ui/JsonLd';

export default function Page() {
  const websiteSchema = generateWebsiteSchema(
    'Website Name',
    'https://your-domain.com',
    'Website description'
  );

  return (
    <>
      <JsonLd data={websiteSchema} />
      {/* Page content */}
    </>
  );
}
```

## Sitemap Generation

A sitemap is automatically generated during the build process using the script at `scripts/generate-sitemap.js`. To manually generate the sitemap:

```bash
npm run generate-sitemap
```

## Customization

To customize the SEO implementation:

1. Update the default values in `src/components/ui/Seo.tsx`
2. Modify the OG image template in `src/app/api/og/route.tsx`
3. Add additional structured data schemas in `src/components/ui/JsonLd.tsx`
4. Update the routes in `scripts/generate-sitemap.js` 