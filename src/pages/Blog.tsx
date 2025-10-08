import { useEffect, useState } from 'react';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, BookOpen, Calculator, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

const blogPosts = [
  {
    id: 1,
    title: "The Ultimate Guide to Small Business Bookkeeping",
    excerpt: "Master the fundamentals of bookkeeping for your small business. Learn about essential financial records, common mistakes to avoid, and best practices that will save you time and money.",
    category: "Bookkeeping Basics",
    author: "Sarah Johnson",
    date: "January 15, 2025",
    readTime: "8 min read",
    icon: BookOpen,
    slug: "small-business-bookkeeping-guide"
  },
  {
    id: 2,
    title: "Double-Entry Bookkeeping: Why It's Essential for Business Growth",
    excerpt: "Discover how double-entry bookkeeping provides a complete picture of your finances, helps prevent errors, and gives you the insights needed to make informed business decisions.",
    category: "Advanced Techniques",
    author: "Michael Chen",
    date: "January 22, 2025",
    readTime: "6 min read",
    icon: Calculator,
    slug: "double-entry-bookkeeping-essentials"
  },
  {
    id: 3,
    title: "Tax Season Preparation: A Bookkeeper's Checklist",
    excerpt: "Get ready for tax season with our comprehensive checklist. From organizing receipts to reconciling accounts, ensure you have everything your accountant needs for a stress-free filing.",
    category: "Tax Preparation",
    author: "Emily Rodriguez",
    date: "January 26, 2025",
    readTime: "10 min read",
    icon: FileText,
    slug: "tax-season-bookkeeping-checklist"
  }
];

export default function Blog() {
  const navigate = useNavigate();
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setDbPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const allPosts = [...dbPosts, ...blogPosts];

  return (
    <>
      <SEO
        title="Blog - Financial Tips & Insights"
        description="Expert advice on bookkeeping, taxes, and financial management for small businesses"
        keywords={['bookkeeping', 'accounting', 'taxes', 'small business', 'financial management']}
      />
      <div className="min-h-screen bg-background">
        <Header />
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Bookkeeping <span className="bg-gradient-primary bg-clip-text text-transparent">Insights</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Expert advice, tips, and strategies to help you master bookkeeping and grow your business
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-16">
            {(() => {
              const FeaturedIcon = blogPosts[0].icon;
              return (
                <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 cursor-pointer border-primary/20"
                      onClick={() => navigate(`/blog/${blogPosts[0].slug}`)}>
                  <CardHeader className="bg-gradient-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FeaturedIcon className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">{blogPosts[0].category}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Featured Article</span>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl mb-2">{blogPosts[0].title}</CardTitle>
                    <CardDescription className="text-lg">{blogPosts[0].excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{blogPosts[0].date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{blogPosts[0].readTime}</span>
                        </div>
                        <span>By {blogPosts[0].author}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="group">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Recent Posts Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.slice(1).map((post) => (
              <Card key={post.id} 
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/blog/${post.slug}`)}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const Icon = post.icon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                    <span className="text-sm font-medium text-primary">{post.category}</span>
                  </div>
                  <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="group">
                      Read
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    By {post.author}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </>
  );
}