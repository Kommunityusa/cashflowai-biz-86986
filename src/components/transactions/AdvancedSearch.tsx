import { useState } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: any[];
}

export interface SearchFilters {
  searchTerm: string;
  type: string;
  categoryId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  amountMin: string;
  amountMax: string;
  vendor: string;
  hasNotes: boolean | null;
  needsReview: boolean | null;
  taxDeductible: boolean | null;
}

export function AdvancedSearch({ onSearch, categories }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    type: 'all',
    categoryId: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: '',
    amountMax: '',
    vendor: '',
    hasNotes: null,
    needsReview: null,
    taxDeductible: null,
  });

  const handleSearch = () => {
    onSearch(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      searchTerm: '',
      type: 'all',
      categoryId: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      amountMin: '',
      amountMax: '',
      vendor: '',
      hasNotes: null,
      needsReview: null,
      taxDeductible: null,
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'type' || key === 'categoryId') return value !== 'all';
    if (key === 'dateFrom' || key === 'dateTo') return value !== undefined;
    if (typeof value === 'boolean') return value !== null;
    return value !== '';
  }).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Advanced Search
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Advanced Search</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* Search Term */}
          <div className="space-y-2">
            <Label>Search Description</Label>
            <Input
              placeholder="Search in descriptions..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter(cat => filters.type === 'all' || cat.type === filters.type)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.amountMin}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.amountMax}
                onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
              />
            </div>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input
              placeholder="Search vendor..."
              value={filters.vendor}
              onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
            />
          </div>

          {/* Flags */}
          <div className="space-y-2">
            <Label>Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.needsReview === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  needsReview: prev.needsReview === true ? null : true 
                }))}
              >
                Needs Review
              </Button>
              <Button
                variant={filters.taxDeductible === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  taxDeductible: prev.taxDeductible === true ? null : true 
                }))}
              >
                Tax Deductible
              </Button>
              <Button
                variant={filters.hasNotes === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  hasNotes: prev.hasNotes === true ? null : true 
                }))}
              >
                Has Notes
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}