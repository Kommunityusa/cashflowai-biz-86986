import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BlogManager } from '@/components/admin/BlogManager';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Loader2 } from 'lucide-react';

export default function AdminBlog() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;

      if (!roles) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO
        title="Blog Management"
        description="Manage blog posts and content"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <BlogManager />
        </main>
      </div>
    </>
  );
}