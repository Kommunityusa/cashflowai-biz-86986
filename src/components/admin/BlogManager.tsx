import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailSequenceTester } from './EmailSequenceTester';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  featured_image_url?: string;
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  published_at?: string;
}

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    author: '',
    is_published: false,
    published_at: undefined,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        const { error } = await supabase
          .from('blog_posts')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing);

        if (error) throw error;
        toast({ title: 'Success', description: 'Blog post updated' });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([{
            title: formData.title!,
            slug: formData.slug!,
            excerpt: formData.excerpt!,
            content: formData.content!,
            category: formData.category!,
            author: formData.author!,
            featured_image_url: formData.featured_image_url,
            is_published: formData.is_published,
            meta_title: formData.meta_title,
            meta_description: formData.meta_description,
            meta_keywords: formData.meta_keywords,
            published_at: formData.is_published ? new Date().toISOString() : null,
          }]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Blog post created' });
      }

      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: '',
        is_published: false,
      });
      setEditing(null);
      loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save blog post',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Blog post deleted' });
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData(post);
    setEditing(post.id);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleGenerateWithAI = async () => {
    if (!formData.category) {
      toast({
        title: 'Error',
        description: 'Please select a category first',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: {
          topic: formData.title || 'bookkeeping tips for Philadelphia small businesses',
          category: formData.category,
          targetKeywords: formData.meta_keywords ? formData.meta_keywords.join(', ') : 'Philadelphia bookkeeping, small business accounting'
        }
      });

      if (error) throw error;

      if (data.blogPost) {
        setFormData({
          ...formData,
          title: data.blogPost.title,
          slug: data.blogPost.slug,
          content: data.blogPost.content,
          excerpt: data.blogPost.excerpt,
          meta_title: data.blogPost.meta_title,
          meta_description: data.blogPost.meta_description,
          meta_keywords: data.blogPost.meta_keywords.split(',').map((k: string) => k.trim()),
        });
        toast({
          title: 'Success',
          description: 'Blog post generated successfully!',
        });
      }
    } catch (error) {
      console.error('Error generating blog post:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate blog post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const scheduleNextDayPublish = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM
    setFormData({
      ...formData,
      published_at: tomorrow.toISOString(),
      is_published: true
    });
    toast({
      title: 'Scheduled',
      description: 'Post will be published tomorrow at 9 AM',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Management</h2>
      </div>

      <Tabs defaultValue="blog" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="blog">Blog Posts</TabsTrigger>
          <TabsTrigger value="emails">Email Sequence</TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Blog Management</h3>
            <Button onClick={() => {
              setEditing(null);
              setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                category: '',
                author: '',
                is_published: false,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={generatingAI}
                  variant="outline"
                >
                  {generatingAI ? 'Generating...' : '✨ Generate with AI'}
                </Button>
                <Button
                  type="button"
                  onClick={scheduleNextDayPublish}
                  variant="outline"
                >
                  📅 Schedule Tomorrow
                </Button>
              </div>
            </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (!editing) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Content (Markdown supported)</Label>
            <Textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
            />
          </div>

          <div className="space-y-2">
            <Label>Featured Image URL</Label>
            <Input
              value={formData.featured_image_url || ''}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta Title (SEO)</Label>
              <Input
                value={formData.meta_title || ''}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Input
                value={formData.meta_description || ''}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label>Publish</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Publish Date/Time (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setFormData({ ...formData, published_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editing ? 'Update' : 'Create'} Post
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setFormData({
                    title: '',
                    slug: '',
                    excerpt: '',
                    content: '',
                    category: '',
                    author: '',
                    is_published: false,
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Published Posts</h3>
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{post.title}</h4>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">Category: {post.category}</span>
                  <span className="text-muted-foreground">Author: {post.author}</span>
                  <span className={post.is_published ? 'text-green-600' : 'text-amber-600'}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                {post.is_published && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
          </div>
        </TabsContent>

        <TabsContent value="emails">
          <EmailSequenceTester />
        </TabsContent>
      </Tabs>
    </div>
  );
}