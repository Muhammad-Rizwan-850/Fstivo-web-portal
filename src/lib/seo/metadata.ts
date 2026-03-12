import { Metadata } from 'next';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'event';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function generateMetadata({
  title,
  description,
  image = '/og-image.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  tags
}: SEOProps): Metadata {
  const siteName = 'FSTIVO';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fstivo.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return {
    title: `${title} | ${siteName}`,
    description,
    keywords: tags?.join(', '),
    authors: authors?.map(name => ({ name })),

    // Open Graph
    openGraph: {
      type: type === 'event' ? 'article' : type,
      locale: 'en_US',
      url: fullUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: '@fstivo',
      creator: '@fstivo',
      title,
      description,
      images: [fullImage],
    },

    // Canonical URL
    alternates: {
      canonical: fullUrl,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
