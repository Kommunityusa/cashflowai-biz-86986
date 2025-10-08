import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/landing/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  featured_image_url?: string;
  published_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        navigate('/blog');
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        keywords={post.meta_keywords}
        image={post.featured_image_url}
        type="article"
        publishedTime={post.published_at}
        author={post.author}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          <article className="max-w-4xl mx-auto">
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-[400px] object-cover rounded-lg mb-8"
              />
            )}

            <header className="mb-8">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {post.category}
                </span>
                <span>{post.author}</span>
                <span>{new Date(post.published_at).toLocaleDateString()}</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            </header>

            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}