import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Transactions = () => {
  useAuth();
  const transactions = [
    { 
      id: 1, 
      date: "2024-03-20", 
      description: "Client Payment - ABC Corp", 
      category: "Income", 
      amount: 2500.00, 
      type: "income",
      account: "Business Checking"
    },
    { 
      id: 2, 
      date: "2024-03-19", 
      description: "Office Supplies - Staples", 
      category: "Office", 
      amount: -234.50, 
      type: "expense",
      account: "Business Credit Card"
    },
    { 
      id: 3, 
      date: "2024-03-18", 
      description: "Software Subscription - Adobe", 
      category: "Software", 
      amount: -99.00, 
      type: "expense",
      account: "Business Checking"
    },
    { 
      id: 4, 
      date: "2024-03-17", 
      description: "Consulting Fee - XYZ Ltd", 
      category: "Income", 
      amount: 5000.00, 
      type: "income",
      account: "Business Checking"
    },
    { 
      id: 5, 
      date: "2024-03-16", 
      description: "Internet Service", 
      category: "Utilities", 
      amount: -89.99, 
      type: "expense",
      account: "Business Checking"
    },
    { 
      id: 6, 
      date: "2024-03-15", 
      description: "Client Lunch Meeting", 
      category: "Meals", 
      amount: -156.75, 
      type: "expense",
      account: "Business Credit Card"
    },
    { 
      id: 7, 
      date: "2024-03-14", 
      description: "Project Payment - Tech Startup", 
      category: "Income", 
      amount: 8500.00, 
      type: "income",
      account: "Business Checking"
    },
    { 
      id: 8, 
      date: "2024-03-13", 
      description: "Cloud Storage - AWS", 
      category: "Software", 
      amount: -45.00, 
      type: "expense",
      account: "Business Credit Card"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-2">View and manage all your business transactions</p>
        </div>

        {/* Actions Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="meals">Meals</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Account</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {transaction.account}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end text-sm font-medium ${
                        transaction.type === 'income' ? 'text-success' : 'text-foreground'
                      }`}>
                        {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to 8 of 156 transactions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;