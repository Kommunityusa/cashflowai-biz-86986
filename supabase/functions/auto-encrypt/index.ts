import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple AES-256 encryption using Web Crypto API
async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Use a fixed salt for deterministic key derivation (in production, use random salt)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("bizflow_salt_2024"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedText: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Convert from base64
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("bizflow_salt_2024"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encryptedData
  );
  
  return decoder.decode(decryptedData);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log('[AUTO-ENCRYPT] Action:', action);

    // Initialize Supabase client with service role key for backend operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the system encryption key from environment
    const encryptionKey = Deno.env.get('SYSTEM_ENCRYPTION_KEY') || 'bizflow_default_key_2024';

    switch (action) {
      case 'encrypt_bank_data': {
        // Automatically encrypt sensitive bank account data
        const { account_number, routing_number, access_token } = data;
        
        const encrypted = {
          account_number_encrypted: account_number ? await encrypt(account_number, encryptionKey) : null,
          routing_number_encrypted: routing_number ? await encrypt(routing_number, encryptionKey) : null,
          plaid_access_token_encrypted: access_token ? await encrypt(access_token, encryptionKey) : null,
        };

        console.log('[AUTO-ENCRYPT] Bank data encrypted successfully');
        
        return new Response(
          JSON.stringify({ success: true, encrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'encrypt_transaction_data': {
        // Automatically encrypt sensitive transaction data
        const { description, vendor_name, notes } = data;
        
        const encrypted = {
          description_encrypted: description ? await encrypt(description, encryptionKey) : null,
          vendor_name_encrypted: vendor_name ? await encrypt(vendor_name, encryptionKey) : null,
          notes_encrypted: notes ? await encrypt(notes, encryptionKey) : null,
        };

        console.log('[AUTO-ENCRYPT] Transaction data encrypted successfully');
        
        return new Response(
          JSON.stringify({ success: true, encrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'decrypt_bank_data': {
        // Decrypt bank account data for authorized access
        const { encrypted_data } = data;
        
        const decrypted = {
          account_number: encrypted_data.account_number_encrypted ? 
            await decrypt(encrypted_data.account_number_encrypted, encryptionKey) : null,
          routing_number: encrypted_data.routing_number_encrypted ? 
            await decrypt(encrypted_data.routing_number_encrypted, encryptionKey) : null,
        };

        console.log('[AUTO-ENCRYPT] Bank data decrypted successfully');
        
        return new Response(
          JSON.stringify({ success: true, decrypted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_encryption_status': {
        // Return system encryption status
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabaseClient.auth.getUser(token);
        const user = userData.user;
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Check encrypted data counts
        const { count: encryptedBankAccounts } = await supabaseClient
          .from('bank_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('account_number_encrypted', 'is', null);

        const { count: totalBankAccounts } = await supabaseClient
          .from('bank_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: encryptedTransactions } = await supabaseClient
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('description_encrypted', 'is', null);

        const { count: totalTransactions } = await supabaseClient
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({
            encryptionEnabled: true,
            systemManaged: true,
            encryptedBankAccounts,
            totalBankAccounts,
            encryptedTransactions,
            totalTransactions,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[AUTO-ENCRYPT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});