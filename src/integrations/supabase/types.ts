export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          action_taken: boolean | null
          created_at: string
          data: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_actionable: boolean | null
          is_read: boolean | null
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_taken?: boolean | null
          created_at?: string
          data?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_taken?: boolean | null
          created_at?: string
          data?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number_encrypted: string | null
          account_number_last4: string | null
          account_type: string | null
          bank_name: string | null
          created_at: string
          current_balance: number | null
          encryption_enabled: boolean | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          notes: string | null
          plaid_access_token: string | null
          plaid_access_token_encrypted: string | null
          plaid_account_id: string | null
          plaid_item_id: string | null
          routing_number: string | null
          routing_number_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number_encrypted?: string | null
          account_number_last4?: string | null
          account_type?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          encryption_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          plaid_access_token?: string | null
          plaid_access_token_encrypted?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          routing_number?: string | null
          routing_number_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number_encrypted?: string | null
          account_number_last4?: string | null
          account_type?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          encryption_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          plaid_access_token?: string | null
          plaid_access_token_encrypted?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          routing_number?: string | null
          routing_number_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          alert_threshold: number | null
          amount: number
          category_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          period: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          amount: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          period: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          period?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          action_category_id: string
          action_type: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_category_id: string
          action_type: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_category_id?: string
          action_type?: string
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_action_category_id_fkey"
            columns: ["action_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          email_number: number
          error_message: string | null
          id: string
          sent_at: string
          status: string | null
          subject: string
          subscriber_id: string | null
        }
        Insert: {
          email_number: number
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string | null
          subject: string
          subscriber_id?: string | null
        }
        Update: {
          email_number?: number
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string | null
          subject?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_email_sent: number | null
          last_email_sent_at: string | null
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed: boolean | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_email_sent?: number | null
          last_email_sent_at?: string | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed?: boolean | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          key_hash: string
          rotated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          rotated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          rotated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          data: Json
          file_url: string | null
          generated_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          file_url?: string | null
          generated_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          report_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          file_url?: string | null
          generated_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string
          created_at: string
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          terms: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lender_contacts: {
        Row: {
          contact_date: string | null
          contact_type: string
          created_at: string
          id: string
          lender_id: string
          notes: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_date?: string | null
          contact_type: string
          created_at?: string
          id?: string
          lender_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_date?: string | null
          contact_type?: string
          created_at?: string
          id?: string
          lender_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_contacts_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lenders: {
        Row: {
          address: string | null
          city: string | null
          counties_served: string[] | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          industries_served: string[] | null
          is_active: boolean | null
          is_cdfi: boolean | null
          loan_range_max: number | null
          loan_range_min: number | null
          loan_types: string[] | null
          name: string
          organization_type: string | null
          phone: string | null
          services: string[] | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          counties_served?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industries_served?: string[] | null
          is_active?: boolean | null
          is_cdfi?: boolean | null
          loan_range_max?: number | null
          loan_range_min?: number | null
          loan_types?: string[] | null
          name: string
          organization_type?: string | null
          phone?: string | null
          services?: string[] | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          counties_served?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industries_served?: string[] | null
          is_active?: boolean | null
          is_cdfi?: boolean | null
          loan_range_max?: number | null
          loan_range_min?: number | null
          loan_types?: string[] | null
          name?: string
          organization_type?: string | null
          phone?: string | null
          services?: string[] | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      plaid_access_tokens: {
        Row: {
          access_token: string
          created_at: string
          cursor: string | null
          id: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          cursor?: string | null
          id?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          cursor?: string | null
          id?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          first_name: string | null
          fiscal_year_start: number | null
          id: string
          last_name: string | null
          last_report_sync: string | null
          phone: string | null
          plaid_consent_date: string | null
          plaid_consent_details: Json | null
          plaid_consent_version: string | null
          state: string | null
          subscription_plan: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          fiscal_year_start?: number | null
          id?: string
          last_name?: string | null
          last_report_sync?: string | null
          phone?: string | null
          plaid_consent_date?: string | null
          plaid_consent_details?: Json | null
          plaid_consent_version?: string | null
          state?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          first_name?: string | null
          fiscal_year_start?: number | null
          id?: string
          last_name?: string | null
          last_report_sync?: string | null
          phone?: string | null
          plaid_consent_date?: string | null
          plaid_consent_details?: Json | null
          plaid_consent_version?: string | null
          state?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          auto_create: boolean | null
          category_id: string | null
          created_at: string
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_processed: string | null
          next_due_date: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_processed?: string | null
          next_due_date: string
          start_date: string
          type: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_processed?: string | null
          next_due_date?: string
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          business_structure: string | null
          created_at: string
          ein: string | null
          id: string
          quarterly_estimates: boolean | null
          state: string | null
          state_tax_id: string | null
          tax_rate: number | null
          tax_year: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_structure?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          quarterly_estimates?: boolean | null
          state?: string | null
          state_tax_id?: string | null
          tax_rate?: number | null
          tax_year?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_structure?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          quarterly_estimates?: boolean | null
          state?: string | null
          state_tax_id?: string | null
          tax_rate?: number | null
          tax_year?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          ai_confidence_score: number | null
          ai_processed_at: string | null
          ai_suggested_category_id: string | null
          amount: number
          attachment_urls: string[] | null
          bank_account_id: string | null
          business_purpose: string | null
          category_id: string | null
          created_at: string
          description: string
          description_encrypted: string | null
          encryption_enabled: boolean | null
          id: string
          is_recurring: boolean | null
          mileage: number | null
          needs_review: boolean | null
          notes: string | null
          notes_encrypted: string | null
          plaid_category: Json | null
          plaid_transaction_id: string | null
          receipt_url: string | null
          reconciled_at: string | null
          recurring_frequency: string | null
          reference_number: string | null
          status: string | null
          tax_deductible: boolean | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_name: string | null
          vendor_name_encrypted: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_processed_at?: string | null
          ai_suggested_category_id?: string | null
          amount: number
          attachment_urls?: string[] | null
          bank_account_id?: string | null
          business_purpose?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          description_encrypted?: string | null
          encryption_enabled?: boolean | null
          id?: string
          is_recurring?: boolean | null
          mileage?: number | null
          needs_review?: boolean | null
          notes?: string | null
          notes_encrypted?: string | null
          plaid_category?: Json | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_name_encrypted?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_processed_at?: string | null
          ai_suggested_category_id?: string | null
          amount?: number
          attachment_urls?: string[] | null
          bank_account_id?: string | null
          business_purpose?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          description_encrypted?: string | null
          encryption_enabled?: boolean | null
          id?: string
          is_recurring?: boolean | null
          mileage?: number | null
          needs_review?: boolean | null
          notes?: string | null
          notes_encrypted?: string | null
          plaid_category?: Json | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_name_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ai_suggested_category_id_fkey"
            columns: ["ai_suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          category_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_1099_required: boolean | null
          name: string
          notes: string | null
          tax_id: string | null
          total_paid_ytd: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_1099_required?: boolean | null
          name: string
          notes?: string | null
          tax_id?: string | null
          total_paid_ytd?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_1099_required?: boolean | null
          name?: string
          notes?: string | null
          tax_id?: string | null
          total_paid_ytd?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      transaction_summaries: {
        Row: {
          average_amount: number | null
          category_name: string | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          type: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_error_message?: string
          p_ip_address?: string
          p_success: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      transaction_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "reconciled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      transaction_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "reconciled",
      ],
    },
  },
} as const
