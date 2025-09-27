import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";
import { Button } from "@/components/ui/button";

interface NewsletterBannerProps {
  storageKey?: string;
}

export function NewsletterBanner({ storageKey = "newsletter-banner-dismissed" }: NewsletterBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
      </Button>
      <div className="pr-8">
        <h3 className="text-sm font-semibold mb-1">Stay Updated with Financial Insights</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Get weekly tips on bookkeeping and tax savings.
        </p>
        <NewsletterSignup compact />
      </div>
    </div>
  );
}