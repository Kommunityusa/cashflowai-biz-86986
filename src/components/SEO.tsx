import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
}

export function SEO({
  title,
  description,
  keywords = [],
  image = '/hero-dashboard.png',
  url = window.location.href,
  type = 'website',
  publishedTime,
  author,
}: SEOProps) {
  const siteName = 'Cash Flow AI';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'Article' : 'WebPage',
          headline: title,
          description: description,
          image: image,
          url: url,
          ...(publishedTime && { datePublished: publishedTime }),
          ...(author && { author: { '@type': 'Person', name: author } }),
          publisher: {
            '@type': 'Organization',
            name: siteName,
            logo: {
              '@type': 'ImageObject',
              url: `${window.location.origin}/cashflow-ai-logo.png`,
            },
          },
        })}
      </script>
    </Helmet>
  );
}