import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function BlogRSS() {
  const navigate = useNavigate();

  useEffect(() => {
    const generateRSS = async () => {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(50);

      if (!posts) return;

      const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://cashflow-ai.lovable.app/blog/${post.slug}</link>
      <guid>https://cashflow-ai.lovable.app/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.published_at || post.created_at).toUTCString()}</pubDate>
      <author>Cash Flow AI Team</author>
      <category>${post.category}</category>
    </item>`).join('\n');

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cash Flow AI Blog - Philadelphia Bookkeeping & Tax Tips</title>
    <link>https://cashflow-ai.lovable.app/blog</link>
    <description>Expert bookkeeping, accounting, and tax advice for Philadelphia small businesses. Local insights, IRS guidance, and practical financial tips.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://cashflow-ai.lovable.app/blog/rss" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

      // Create downloadable RSS feed
      const blob = new Blob([rss], { type: 'application/rss+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cashflow-ai-blog.xml';
      a.click();
      
      navigate('/blog');
    };

    generateRSS();
  }, [navigate]);

  return null;
}
