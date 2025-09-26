import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" })
  .toLowerCase();

// Password validation schema with strong requirements
export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password must be less than 128 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" });

// Bank account validation schemas
export const bankAccountSchema = z.object({
  account_name: z.string()
    .trim()
    .min(1, { message: "Account name is required" })
    .max(100, { message: "Account name must be less than 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, { message: "Account name contains invalid characters" }),
  
  routing_number: z.string()
    .optional()
    .refine((val) => !val || /^\d{9}$/.test(val), {
      message: "Routing number must be exactly 9 digits"
    }),
  
  account_number: z.string()
    .optional()
    .refine((val) => !val || /^\d{4,17}$/.test(val), {
      message: "Account number must be between 4 and 17 digits"
    }),
});

// Transaction validation schema
export const transactionSchema = z.object({
  description: z.string()
    .trim()
    .min(1, { message: "Description is required" })
    .max(500, { message: "Description must be less than 500 characters" })
    .regex(/^[^<>]*$/, { message: "Description contains invalid characters" }),
  
  amount: z.number()
    .min(0.01, { message: "Amount must be greater than 0" })
    .max(999999999.99, { message: "Amount is too large" })
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can only have up to 2 decimal places"
    }),
  
  vendor_name: z.string()
    .trim()
    .max(200, { message: "Vendor name must be less than 200 characters" })
    .regex(/^[^<>]*$/, { message: "Vendor name contains invalid characters" })
    .optional(),
  
  notes: z.string()
    .trim()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .regex(/^[^<>]*$/, { message: "Notes contain invalid characters" })
    .optional(),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Category name is required" })
    .max(50, { message: "Category name must be less than 50 characters" })
    .regex(/^[a-zA-Z0-9\s\-&]+$/, { message: "Category name contains invalid characters" }),
  
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be either income or expense" })
  }),
  
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Invalid color format" })
    .optional(),
});

// Profile validation schema
export const profileSchema = z.object({
  first_name: z.string()
    .trim()
    .max(50, { message: "First name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s\-']*$/, { message: "First name contains invalid characters" })
    .optional(),
  
  last_name: z.string()
    .trim()
    .max(50, { message: "Last name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s\-']*$/, { message: "Last name contains invalid characters" })
    .optional(),
  
  business_name: z.string()
    .trim()
    .max(100, { message: "Business name must be less than 100 characters" })
    .regex(/^[^<>]*$/, { message: "Business name contains invalid characters" })
    .optional(),
  
  phone: z.string()
    .trim()
    .regex(/^(\+\d{1,3}[- ]?)?\d{10}$/, { message: "Invalid phone number format" })
    .optional()
    .or(z.literal('')),
  
  tax_id: z.string()
    .trim()
    .regex(/^\d{2}-?\d{7}$|^\d{3}-?\d{2}-?\d{4}$/, { message: "Invalid Tax ID format" })
    .optional()
    .or(z.literal('')),
  
  zip_code: z.string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP code format" })
    .optional()
    .or(z.literal('')),
});

// Sanitize HTML content
export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  // Remove any script content
  const withoutScripts = withoutTags.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Escape special characters
  return withoutScripts
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and sanitize URL parameters
export function sanitizeUrlParam(param: string): string {
  return encodeURIComponent(param.slice(0, 200)); // Limit length and encode
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(time => now - time < this.windowMs);
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
}

// Export a default rate limiter instance
export const defaultRateLimiter = new RateLimiter();