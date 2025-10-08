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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_mask: string | null
          account_name: string
          account_number_last4: string | null
          account_type: string | null
          available_balance: number | null
          bank_name: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          encryption_enabled: boolean | null
          id: string
          institution_name: string
          is_active: boolean | null
          last_synced_at: string | null
          notes: string | null
          plaid_access_token: string | null
          plaid_account_id: string | null
          plaid_item_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_mask?: string | null
          account_name: string
          account_number_last4?: string | null
          account_type?: string | null
          available_balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          encryption_enabled?: boolean | null
          id?: string
          institution_name: string
          is_active?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          plaid_access_token?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_mask?: string | null
          account_name?: string
          account_number_last4?: string | null
          account_type?: string | null
          available_balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          encryption_enabled?: boolean | null
          id?: string
          institution_name?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          notes?: string | null
          plaid_access_token?: string | null
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          alert_threshold: number | null
          amount: number
          category_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          period: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          amount: number
          category_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          period: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          amount?: number
          category_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          period?: string
          start_date?: string
          updated_at?: string | null
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
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categorization_rules: {
        Row: {
          category_id: string
          condition_type: string
          condition_value: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          condition_type: string
          condition_value: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          condition_type?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      plaid_access_tokens: {
        Row: {
          access_token: string | null
          access_token_encrypted: string
          created_at: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_active: boolean | null
          item_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_encrypted: string
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_active?: boolean | null
          item_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          access_token_encrypted?: string
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_active?: boolean | null
          item_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accounting_method: string | null
          address: string | null
          business_name: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          fiscal_year_end: string | null
          full_name: string | null
          id: string
          last_report_sync: string | null
          paypal_subscription_id: string | null
          phone: string | null
          plaid_consent_date: string | null
          plaid_consent_details: Json | null
          plaid_consent_version: string | null
          state: string | null
          subscription_plan: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          accounting_method?: string | null
          address?: string | null
          business_name?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          fiscal_year_end?: string | null
          full_name?: string | null
          id?: string
          last_report_sync?: string | null
          paypal_subscription_id?: string | null
          phone?: string | null
          plaid_consent_date?: string | null
          plaid_consent_details?: Json | null
          plaid_consent_version?: string | null
          state?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          zip?: string | null
        }
        Update: {
          accounting_method?: string | null
          address?: string | null
          business_name?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          fiscal_year_end?: string | null
          full_name?: string | null
          id?: string
          last_report_sync?: string | null
          paypal_subscription_id?: string | null
          phone?: string | null
          plaid_consent_date?: string | null
          plaid_consent_details?: Json | null
          plaid_consent_version?: string | null
          state?: string | null
          subscription_plan?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string | null
          confidence_score: number | null
          created_at: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_date: string | null
          type: string
          updated_at: string | null
          user_id: string
          vendor_name: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_date?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          vendor_name: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_date?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          vendor_name?: string
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
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          created_at: string | null
          description: string
          id: string
          is_recurring: boolean | null
          needs_review: boolean | null
          notes: string | null
          plaid_category: string | null
          plaid_transaction_id: string | null
          receipt_url: string | null
          status: string | null
          tax_deductible: boolean | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_recurring?: boolean | null
          needs_review?: boolean | null
          notes?: string | null
          plaid_category?: string | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date: string
          type: string
          updated_at?: string | null
          user_id: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_recurring?: boolean | null
          needs_review?: boolean | null
          notes?: string | null
          plaid_category?: string | null
          plaid_transaction_id?: string | null
          receipt_url?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
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
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_1099_required: boolean | null
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          total_paid_ytd: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_1099_required?: boolean | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          total_paid_ytd?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_1099_required?: boolean | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_paid_ytd?: number | null
          updated_at?: string | null
          user_id?: string
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
      [_ in never]: never
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
