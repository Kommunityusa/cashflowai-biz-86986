import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/landing/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  author: string;
  published_at: string;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  featured_image_url?: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          <article>
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
              />
            )}

            <header className="mb-12">
              <Badge variant="secondary" className="mb-4 text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {post.category}
              </Badge>
              
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                {post.title}
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6">
                {post.excerpt}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.published_at || post.created_at)}
                </span>
              </div>
            </header>

            <div className="article-content">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>

          <div className="mt-12 pt-8 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/blog')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Posts
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
