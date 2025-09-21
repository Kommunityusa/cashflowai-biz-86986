import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a unique encryption key for each user
async function generateUserKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}

// Encrypt data using Web Crypto API
async function encryptData(data: string, key: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import key
    const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data
async function decryptData(encryptedData: string, key: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Import key
    const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { action, data } = await req.json();
    
    switch (action) {
      case 'generate_key': {
        const key = await generateUserKey();
        
        // Store key metadata (not the key itself)
        const keyHash = btoa(String.fromCharCode(...new Uint8Array(
          await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
        )));
        
        const { error: dbError } = await supabaseClient
          .from('encryption_keys')
          .upsert({
            user_id: user.id,
            key_hash: keyHash,
            created_at: new Date().toISOString(),
            is_active: true
          });
        
        if (dbError) {
          console.error('Database error:', dbError);
        }
        
        return new Response(
          JSON.stringify({ key }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'encrypt': {
        const { plaintext, key } = data;
        
        if (!plaintext || !key) {
          return new Response(
            JSON.stringify({ error: 'Missing required data' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        const encrypted = await encryptData(plaintext, key);
        
        return new Response(
          JSON.stringify({ encrypted }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'decrypt': {
        const { encrypted, key } = data;
        
        if (!encrypted || !key) {
          return new Response(
            JSON.stringify({ error: 'Missing required data' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        const decrypted = await decryptData(encrypted, key);
        
        return new Response(
          JSON.stringify({ decrypted }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'encrypt_bank_account': {
        const { bankAccountId, accountNumber, routingNumber, accessToken } = data;
        const { key } = data;
        
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Encryption key required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        // Encrypt sensitive fields
        const encryptedData: any = {};
        
        if (accountNumber) {
          encryptedData.account_number_encrypted = await encryptData(accountNumber, key);
        }
        if (routingNumber) {
          encryptedData.routing_number_encrypted = await encryptData(routingNumber, key);
        }
        if (accessToken) {
          encryptedData.plaid_access_token_encrypted = await encryptData(accessToken, key);
        }
        
        // Update bank account with encrypted data
        const { error: updateError } = await supabaseClient
          .from('bank_accounts')
          .update({
            ...encryptedData,
            encryption_enabled: true,
            // Clear plain text versions
            routing_number: null,
            plaid_access_token: null
          })
          .eq('id', bankAccountId)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Failed to update bank account:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to encrypt bank account' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'encrypt_transaction': {
        const { transactionId, description, vendorName, notes } = data;
        const { key } = data;
        
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Encryption key required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        // Encrypt sensitive fields
        const encryptedData: any = {};
        
        if (description) {
          encryptedData.description_encrypted = await encryptData(description, key);
        }
        if (vendorName) {
          encryptedData.vendor_name_encrypted = await encryptData(vendorName, key);
        }
        if (notes) {
          encryptedData.notes_encrypted = await encryptData(notes, key);
        }
        
        // Update transaction with encrypted data
        const { error: updateError } = await supabaseClient
          .from('transactions')
          .update({
            ...encryptedData,
            encryption_enabled: true,
            // Keep searchable versions but mark as encrypted
            description: '[ENCRYPTED]',
            vendor_name: vendorName ? '[ENCRYPTED]' : null,
            notes: notes ? '[ENCRYPTED]' : null
          })
          .eq('id', transactionId)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Failed to update transaction:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to encrypt transaction' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'rotate_key': {
        const { oldKey } = data;
        
        // Generate new key
        const newKey = await generateUserKey();
        
        // Get all encrypted data for the user
        const { data: bankAccounts } = await supabaseClient
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('encryption_enabled', true);
        
        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('encryption_enabled', true);
        
        // Re-encrypt bank accounts
        for (const account of bankAccounts || []) {
          const updates: any = {};
          
          if (account.account_number_encrypted) {
            const decrypted = await decryptData(account.account_number_encrypted, oldKey);
            updates.account_number_encrypted = await encryptData(decrypted, newKey);
          }
          if (account.routing_number_encrypted) {
            const decrypted = await decryptData(account.routing_number_encrypted, oldKey);
            updates.routing_number_encrypted = await encryptData(decrypted, newKey);
          }
          if (account.plaid_access_token_encrypted) {
            const decrypted = await decryptData(account.plaid_access_token_encrypted, oldKey);
            updates.plaid_access_token_encrypted = await encryptData(decrypted, newKey);
          }
          
          await supabaseClient
            .from('bank_accounts')
            .update(updates)
            .eq('id', account.id);
        }
        
        // Re-encrypt transactions
        for (const transaction of transactions || []) {
          const updates: any = {};
          
          if (transaction.description_encrypted) {
            const decrypted = await decryptData(transaction.description_encrypted, oldKey);
            updates.description_encrypted = await encryptData(decrypted, newKey);
          }
          if (transaction.vendor_name_encrypted) {
            const decrypted = await decryptData(transaction.vendor_name_encrypted, oldKey);
            updates.vendor_name_encrypted = await encryptData(decrypted, newKey);
          }
          if (transaction.notes_encrypted) {
            const decrypted = await decryptData(transaction.notes_encrypted, oldKey);
            updates.notes_encrypted = await encryptData(decrypted, newKey);
          }
          
          await supabaseClient
            .from('transactions')
            .update(updates)
            .eq('id', transaction.id);
        }
        
        // Update key metadata
        await supabaseClient
          .from('encryption_keys')
          .update({ is_active: false, rotated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        const keyHash = btoa(String.fromCharCode(...new Uint8Array(
          await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newKey))
        )));
        
        await supabaseClient
          .from('encryption_keys')
          .insert({
            user_id: user.id,
            key_hash: keyHash,
            created_at: new Date().toISOString(),
            is_active: true
          });
        
        return new Response(
          JSON.stringify({ newKey }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'get_encryption_status': {
        // Check encryption status for user's data
        const { data: bankAccounts } = await supabaseClient
          .from('bank_accounts')
          .select('id, encryption_enabled')
          .eq('user_id', user.id);
        
        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('id, encryption_enabled')
          .eq('user_id', user.id);
        
        const { data: encryptionKeys } = await supabaseClient
          .from('encryption_keys')
          .select('created_at, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        
        const encryptedBankAccounts = bankAccounts?.filter(ba => ba.encryption_enabled).length || 0;
        const totalBankAccounts = bankAccounts?.length || 0;
        
        const encryptedTransactions = transactions?.filter(t => t.encryption_enabled).length || 0;
        const totalTransactions = transactions?.length || 0;
        
        return new Response(
          JSON.stringify({ 
            hasActiveKey: !!encryptionKeys,
            keyCreatedAt: encryptionKeys?.created_at,
            encryptedBankAccounts,
            totalBankAccounts,
            encryptedTransactions,
            totalTransactions,
            bankAccountsPercentage: totalBankAccounts > 0 ? Math.round((encryptedBankAccounts / totalBankAccounts) * 100) : 0,
            transactionsPercentage: totalTransactions > 0 ? Math.round((encryptedTransactions / totalTransactions) * 100) : 0
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }
  } catch (error) {
    console.error('Encryption service error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
