import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Building2, Phone, Mail, Globe } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: string;
  tax_id?: string;
  is_1099_required: boolean;
  notes?: string;
  total_paid_ytd: number;
}

export function VendorManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
    tax_id: "",
    is_1099_required: false,
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.name) {
      toast({
        title: "Error",
        description: "Please enter a vendor name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user?.id,
          ...newVendor,
          total_paid_ytd: 0,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor added successfully",
      });

      setIsAddDialogOpen(false);
      setNewVendor({
        name: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        address: "",
        tax_id: "",
        is_1099_required: false,
        notes: "",
      });
      fetchVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          name: editingVendor.name,
          contact_email: editingVendor.contact_email,
          contact_phone: editingVendor.contact_phone,
          website: editingVendor.website,
          address: editingVendor.address,
          tax_id: editingVendor.tax_id,
          is_1099_required: editingVendor.is_1099_required,
          notes: editingVendor.notes,
        })
        .eq('id', editingVendor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      setEditingVendor(null);
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });

      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor. It may be linked to transactions.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vendor Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor to track payments and manage 1099 requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ABC Supplies Inc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax_id">Tax ID / EIN</Label>
                  <Input
                    id="tax_id"
                    value={newVendor.tax_id}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, tax_id: e.target.value }))}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newVendor.contact_email}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={newVendor.contact_phone}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newVendor.website}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this vendor..."
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_1099"
                  checked={newVendor.is_1099_required}
                  onCheckedChange={(checked) => 
                    setNewVendor(prev => ({ ...prev, is_1099_required: checked as boolean }))
                  }
                />
                <Label htmlFor="is_1099" className="cursor-pointer">
                  1099 Required (for tax reporting)
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVendor}>
                Add Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No vendors added yet. Click "Add Vendor" to get started.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>1099</TableHead>
                  <TableHead className="text-right">YTD Paid</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {vendor.contact_email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {vendor.contact_email}
                          </div>
                        )}
                        {vendor.contact_phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {vendor.contact_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vendor.tax_id || <span className="text-muted-foreground">Not provided</span>}
                    </TableCell>
                    <TableCell>
                      {vendor.is_1099_required ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Required
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ${vendor.total_paid_ytd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingVendor(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleDeleteVendor(vendor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editingVendor && (
        <Dialog open={!!editingVendor} onOpenChange={() => setEditingVendor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>
                Update vendor information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Vendor Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingVendor.name}
                    onChange={(e) => setEditingVendor(prev => 
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tax_id">Tax ID / EIN</Label>
                  <Input
                    id="edit-tax_id"
                    value={editingVendor.tax_id || ""}
                    onChange={(e) => setEditingVendor(prev => 
                      prev ? { ...prev, tax_id: e.target.value } : null
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact_email">Email</Label>
                  <Input
                    id="edit-contact_email"
                    type="email"
                    value={editingVendor.contact_email || ""}
                    onChange={(e) => setEditingVendor(prev => 
                      prev ? { ...prev, contact_email: e.target.value } : null
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-contact_phone">Phone</Label>
                  <Input
                    id="edit-contact_phone"
                    value={editingVendor.contact_phone || ""}
                    onChange={(e) => setEditingVendor(prev => 
                      prev ? { ...prev, contact_phone: e.target.value } : null
                    )}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editingVendor.website || ""}
                  onChange={(e) => setEditingVendor(prev => 
                    prev ? { ...prev, website: e.target.value } : null
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editingVendor.address || ""}
                  onChange={(e) => setEditingVendor(prev => 
                    prev ? { ...prev, address: e.target.value } : null
                  )}
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingVendor.notes || ""}
                  onChange={(e) => setEditingVendor(prev => 
                    prev ? { ...prev, notes: e.target.value } : null
                  )}
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_1099"
                  checked={editingVendor.is_1099_required}
                  onCheckedChange={(checked) => 
                    setEditingVendor(prev => 
                      prev ? { ...prev, is_1099_required: checked as boolean } : null
                    )
                  }
                />
                <Label htmlFor="edit-is_1099" className="cursor-pointer">
                  1099 Required (for tax reporting)
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingVendor(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateVendor}>
                Update Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}