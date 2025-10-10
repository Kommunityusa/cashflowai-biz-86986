import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Palette } from "lucide-react";
import * as Icons from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_default: boolean;
  irs_category_code?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export function CategoryManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#3B82F6",
    icon: "tag",
  });

  // Common icon options for categories
  const iconOptions = [
    "tag", "dollar-sign", "briefcase", "home", "car", "shopping-cart",
    "utensils", "heart", "book", "plane", "gift", "zap", "phone",
    "monitor", "music", "film", "coffee", "users", "shield", "tool"
  ];

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
  ];

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('type')
        .order('name');

      if (error) throw error;
      const typedData = (data || []).map(cat => ({
        ...cat,
        type: cat.type as 'income' | 'expense'
      }));
      setCategories(typedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user?.id,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          icon: newCategory.icon,
          is_default: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setIsAddDialogOpen(false);
      setNewCategory({
        name: "",
        type: "expense",
        color: "#3B82F6",
        icon: "tag",
      });
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          color: editingCategory.color,
          icon: editingCategory.icon,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by transactions.",
        variant: "destructive",
      });
    }
  };

  const getIconComponent = (iconName: string | null) => {
    const DefaultIcon = Icons.Tag;
    if (!iconName) {
      return <DefaultIcon className="h-4 w-4" />;
    }
    const IconComponent = (Icons as any)[
      iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, x => x[1].toUpperCase())
    ] || Icons.Tag;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IRS-Approved Categories</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Categories are based on IRS Publication 334 tax guidelines and cannot be modified.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Income Categories</h3>
              <div className="grid gap-2">
                {categories.filter(c => c.type === 'income').map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <span className="font-medium">{category.name}</span>
                        {category.irs_category_code && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">IRS Approved</span>
                        )}
                      </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Expense Categories</h3>
              <div className="grid gap-2">
                {categories.filter(c => c.type === 'expense').map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <span className="font-medium">{category.name}</span>
                        {category.irs_category_code && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">IRS Approved</span>
                        )}
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}