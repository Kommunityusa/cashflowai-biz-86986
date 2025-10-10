import { supabase } from "@/integrations/supabase/client";
import { encryptData, decryptData } from "./encryption";

/**
 * Securely handles sensitive profile data with encryption
 */

// Generate a deterministic encryption key from user's auth token
// This ensures the key is consistent across sessions but never stored in plain text
async function getProfileEncryptionKey(userId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }
  
  // Use a combination of user ID and session token to create deterministic key
  // This is more secure than storing keys in browser storage
  const keyMaterial = `${userId}-${session.access_token.substring(0, 32)}`;
  
  // Hash the key material for consistent encryption key
  const encoder = new TextEncoder();
  const data = encoder.encode(keyMaterial);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Encrypts sensitive profile field before saving
 */
export async function encryptProfileField(
  userId: string,
  fieldValue: string
): Promise<string | null> {
  if (!fieldValue || fieldValue.trim() === '') {
    return null;
  }
  
  try {
    const key = await getProfileEncryptionKey(userId);
    return encryptData(fieldValue, key);
  } catch (error) {
    console.error('Encryption error - sensitive data not saved');
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts sensitive profile field when reading
 */
export async function decryptProfileField(
  userId: string,
  encryptedValue: string | null
): Promise<string> {
  if (!encryptedValue) {
    return '';
  }
  
  try {
    const key = await getProfileEncryptionKey(userId);
    const decrypted = decryptData(encryptedValue, key);
    return decrypted || '';
  } catch (error) {
    console.error('Decryption error');
    return '';
  }
}

/**
 * Validates user can only access their own profile
 */
export function validateProfileAccess(userId: string, authUserId: string | undefined): boolean {
  if (!authUserId || userId !== authUserId) {
    console.error('Unauthorized profile access attempt');
    return false;
  }
  return true;
}

/**
 * Sanitizes profile data before sending to external services
 * Removes sensitive fields that should never leave the database
 */
export function sanitizeProfileForExternal(profile: any): any {
  const { tax_id, stripe_customer_id, paypal_subscription_id, ...safe } = profile;
  return safe;
}

/**
 * Validates that profile updates only contain allowed fields
 */
export function validateProfileUpdate(updates: any): boolean {
  const allowedFields = [
    'full_name',
    'phone',
    'address',
    'city',
    'state',
    'zip',
    'country',
    'business_name',
    'tax_id',
    'company_name',
    'fiscal_year_end',
    'accounting_method',
  ];
  
  const updateKeys = Object.keys(updates).filter(key => key !== 'user_id' && key !== 'updated_at');
  const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
  
  if (invalidFields.length > 0) {
    console.error('Invalid profile fields:', invalidFields);
    return false;
  }
  
  return true;
}
