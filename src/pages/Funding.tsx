import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Building, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Lender {
  id: string;
  name: string;
  organization_type: string;
  description: string;
  services: string[];
  loan_types: string[];
  loan_range_min: number;
  loan_range_max: number;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  counties_served: string[];
  industries_served: string[];
  is_cdfi: boolean;
}

interface LenderContact {
  id?: string;
  lender_id: string;
  contact_type: string;
  status: string;
  notes: string;
}

export default function Funding() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [filteredLenders, setFilteredLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedLoanType, setSelectedLoanType] = useState("all");
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState<LenderContact>({
    lender_id: "",
    contact_type: "inquiry",
    status: "pending",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLenders();
  }, []);

  useEffect(() => {
    filterLenders();
  }, [searchTerm, selectedCounty, selectedLoanType, lenders]);

  const fetchLenders = async () => {
    try {
      const { data, error } = await supabase
        .from("lenders")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setLenders(data || []);
      setFilteredLenders(data || []);
    } catch (error) {
      console.error("Error fetching lenders:", error);
      toast({
        title: "Error",
        description: "Failed to load lenders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLenders = () => {
    let filtered = [...lenders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lender =>
        lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lender.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lender.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lender.loan_types.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // County filter
    if (selectedCounty !== "all") {
      filtered = filtered.filter(lender =>
        lender.counties_served.includes(selectedCounty) ||
        lender.counties_served.includes("All Pennsylvania counties")
      );
    }

    // Loan type filter
    if (selectedLoanType !== "all") {
      filtered = filtered.filter(lender =>
        lender.loan_types.includes(selectedLoanType)
      );
    }

    setFilteredLenders(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleContactLender = (lender: Lender) => {
    setSelectedLender(lender);
    setContactForm({
      ...contactForm,
      lender_id: lender.id
    });
    setContactDialogOpen(true);
  };

  const submitContactForm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to contact lenders.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("lender_contacts")
        .insert({
          ...contactForm,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your inquiry has been recorded. We'll help you connect with the lender.",
      });
      
      setContactDialogOpen(false);
      setContactForm({
        lender_id: "",
        contact_type: "inquiry",
        status: "pending",
        notes: ""
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get unique counties and loan types for filters
  const allCounties = [...new Set(lenders.flatMap(l => l.counties_served))].sort();
  const allLoanTypes = [...new Set(lenders.flatMap(l => l.loan_types))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Funding Partners</h1>
          <p className="text-muted-foreground">
            Connect with trusted PA CDFI Network lenders ready to help your business grow
          </p>
        </div>

        {/* AI Insights Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Funding Readiness Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Based on your financial data, you may qualify for loans between $10,000 - $50,000. 
              Make sure your last 3 months of bank statements are synced for the best lending matches.
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search lenders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {allCounties.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLoanType} onValueChange={setSelectedLoanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Loan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loan Types</SelectItem>
                  {allLoanTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedCounty("all");
                setSelectedLoanType("all");
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredLenders.length} of {lenders.length} lenders
        </p>

        {/* Lenders Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLenders.map((lender) => (
              <Card key={lender.id} className="hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lender.name}</CardTitle>
                      {lender.is_cdfi && (
                        <Badge variant="secondary" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          CDFI Certified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lender.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {formatCurrency(lender.loan_range_min)} - {formatCurrency(lender.loan_range_max)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{lender.city}, {lender.state}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {lender.loan_types.slice(0, 3).map((type, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                    {lender.loan_types.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lender.loan_types.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleContactLender(lender)}
                  >
                    Contact
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(lender.website, "_blank")}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact {selectedLender?.name}</DialogTitle>
            <DialogDescription>
              We'll help you connect with this lender. Tell us about your funding needs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Contact Type</label>
              <Select 
                value={contactForm.contact_type} 
                onValueChange={(value) => setContactForm({...contactForm, contact_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">General Inquiry</SelectItem>
                  <SelectItem value="application">Loan Application</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Describe your funding needs, loan amount, and purpose..."
                value={contactForm.notes}
                onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                rows={4}
              />
            </div>

            {selectedLender && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{selectedLender.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{selectedLender.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a href={selectedLender.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {selectedLender.website}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitContactForm}>
              Submit Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}