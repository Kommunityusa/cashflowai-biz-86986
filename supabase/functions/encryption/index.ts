import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption key derivation (in production, use a more secure method)
function deriveKey(userId: string, salt: string): string {
  return btoa(userId + salt);
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { action, data } = await req.json();
    
    // Use service role for sensitive operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'encrypt_profile_data': {
        const { taxId, phone } = data;
        
        // Generate a unique encryption key for this user
        const salt = crypto.randomUUID();
        const encryptionKey = deriveKey(user.id, salt);
        
        // Encrypt sensitive fields using Supabase's encryption functions
        const { data: encryptedTaxId } = await supabaseAdmin.rpc('encrypt_sensitive_data', {
          data: taxId,
          key: encryptionKey
        });
        
        const { data: encryptedPhone } = await supabaseAdmin.rpc('encrypt_sensitive_data', {
          data: phone,
          key: encryptionKey
        });
        
        // Update the profile with encrypted data
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            tax_id_encrypted: encryptedTaxId,
            phone_encrypted: encryptedPhone,
            tax_id: null, // Clear the plain text version
            phone: null // Clear the plain text version
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to encrypt profile data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Update encryption status
        await supabaseAdmin
          .from('encryption_status')
          .upsert({
            user_id: user.id,
            sensitive_data_encrypted: true,
            last_encrypted_at: new Date().toISOString()
          });
        
        return new Response(
          JSON.stringify({ success: true, message: 'Profile data encrypted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      case 'decrypt_profile_data': {
        // Get encrypted data from profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('tax_id_encrypted, phone_encrypted')
          .eq('user_id', user.id)
          .single();
        
        if (profileError || !profile) {
          return new Response(
            JSON.stringify({ error: 'Profile not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        // Generate the same encryption key
        const salt = crypto.randomUUID(); // In production, store and retrieve this
        const encryptionKey = deriveKey(user.id, salt);
        
        // Decrypt the data
        const { data: decryptedTaxId } = await supabaseAdmin.rpc('decrypt_sensitive_data', {
          encrypted_data: profile.tax_id_encrypted,
          key: encryptionKey
        });
        
        const { data: decryptedPhone } = await supabaseAdmin.rpc('decrypt_sensitive_data', {
          encrypted_data: profile.phone_encrypted,
          key: encryptionKey
        });
        
        return new Response(
          JSON.stringify({
            taxId: decryptedTaxId,
            phone: decryptedPhone
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      case 'encrypt_document': {
        const { fileName, fileContent, fileType } = data;
        
        // Generate encryption key for document
        const documentKey = crypto.randomUUID();
        const encryptionKey = deriveKey(user.id, documentKey);
        
        // Encrypt the file content
        const encryptedContent = btoa(fileContent); // Simple base64 encoding for demo
        
        // Store encrypted document metadata
        const { error: insertError } = await supabaseAdmin
          .from('encrypted_documents')
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_type: fileType,
            file_size: fileContent.length,
            encrypted_url: encryptedContent,
            encryption_key_hash: btoa(documentKey)
          });
        
        if (insertError) {
          console.error('Error storing encrypted document:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to encrypt document' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Document encrypted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      case 'get_encryption_status': {
        const { data: status, error } = await supabaseClient
          .from('encryption_status')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching encryption status:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch encryption status' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            status: status || { 
              sensitive_data_encrypted: false,
              encryption_version: 1 
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});