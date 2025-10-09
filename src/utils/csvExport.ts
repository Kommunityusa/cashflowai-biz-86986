import Papa from "papaparse";

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTransactionsToCSV = (transactions: any[]) => {
  const formatted = transactions.map(t => ({
    Date: t.transaction_date,
    Description: t.description,
    Amount: t.amount,
    Type: t.type,
    Category: t.categories?.name || "Uncategorized",
    Vendor: t.vendor_name || "",
    Status: t.status,
    Notes: t.notes || ""
  }));
  
  exportToCSV(formatted, `transactions_${new Date().toISOString().split('T')[0]}`);
};

export const exportReportToCSV = (reportData: any[], reportName: string) => {
  exportToCSV(reportData, `${reportName}_${new Date().toISOString().split('T')[0]}`);
};
