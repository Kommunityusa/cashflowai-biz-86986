import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Trash2, Bot } from "lucide-react";

export function TransactionRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [newRule, setNewRule] = useState({
    rule_name: '',
    condition_field: 'description',
    condition_operator: 'contains',
    condition_value: '',
    action_category_id: '',
    action_type: 'expense',
    is_active: true,
    priority: 100
  });

  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, []);

  const fetchRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch rules directly without join for now
      const { data, error } = await supabase
        .from('categorization_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.rule_name || !newRule.condition_value || !newRule.action_category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('categorization_rules')
        .insert({
          user_id: user.id,
          ...newRule
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule created successfully",
      });

      setIsAddDialogOpen(false);
      setNewRule({
        rule_name: '',
        condition_field: 'description',
        condition_operator: 'contains',
        condition_value: '',
        action_category_id: '',
        action_type: 'expense',
        is_active: true,
        priority: 100
      });
      fetchRules();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast({
        title: "Error",
        description: "Failed to create rule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const applyRulesToTransactions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all active rules
      const activeRules = rules.filter(r => r.is_active);
      
      // Get uncategorized transactions
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .is('category_id', null);

      if (fetchError) throw fetchError;

      let appliedCount = 0;

      for (const transaction of transactions || []) {
        for (const rule of activeRules) {
          let matches = false;
          
          const fieldValue = (transaction[rule.condition_field] || '').toString().toLowerCase();
          const conditionValue = rule.condition_value.toLowerCase();
          
          switch (rule.condition_operator) {
            case 'contains':
              matches = fieldValue.includes(conditionValue);
              break;
            case 'equals':
              matches = fieldValue === conditionValue;
              break;
            case 'greater_than':
              matches = parseFloat(fieldValue) > parseFloat(rule.condition_value);
              break;
            case 'less_than':
              matches = parseFloat(fieldValue) < parseFloat(rule.condition_value);
              break;
          }
          
          if (matches) {
            const { error: updateError } = await supabase
              .from('transactions')
              .update({
                category_id: rule.action_category_id,
                type: rule.action_type,
                needs_review: false
              })
              .eq('id', transaction.id);

            if (!updateError) {
              appliedCount++;
              break; // Apply only the first matching rule
            }
          }
        }
      }

      toast({
        title: "Rules Applied",
        description: `Categorized ${appliedCount} transactions using rules`,
      });
    } catch (error) {
      console.error('Error applying rules:', error);
      toast({
        title: "Error",
        description: "Failed to apply rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Categorization Rules</h3>
        <div className="flex gap-2">
          <Button
            onClick={applyRulesToTransactions}
            disabled={loading}
            variant="outline"
          >
            <Bot className="mr-2 h-4 w-4" />
            Apply Rules
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Categorization Rule</DialogTitle>
                <DialogDescription>
                  Create a rule to automatically categorize transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    placeholder="e.g., Spotify Subscription"
                    value={newRule.rule_name}
                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Field</Label>
                    <Select
                      value={newRule.condition_field}
                      onValueChange={(value) => setNewRule({ ...newRule, condition_field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="vendor_name">Vendor</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Operator</Label>
                    <Select
                      value={newRule.condition_operator}
                      onValueChange={(value) => setNewRule({ ...newRule, condition_operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        {newRule.condition_field === 'amount' && (
                          <>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Value</Label>
                    <Input
                      placeholder="Value"
                      value={newRule.condition_value}
                      onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newRule.action_type}
                      onValueChange={(value) => setNewRule({ ...newRule, action_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newRule.action_category_id}
                      onValueChange={(value) => setNewRule({ ...newRule, action_category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.type === newRule.action_type)
                          .map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRule} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Create Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No rules created yet. Add rules to automatically categorize transactions.
          </p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                />
                <div>
                  <p className="font-medium">{rule.rule_name}</p>
                  <p className="text-sm text-muted-foreground">
                    If {rule.condition_field} {rule.condition_operator} "{rule.condition_value}" 
                    → {getCategoryName(rule.action_category_id)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRule(rule.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}