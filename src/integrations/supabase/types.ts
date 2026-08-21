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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          method: string
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          method?: string
          reference?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          method?: string
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body: string
          excerpt: string
          id: string
          image_url: string | null
          position: number
          read_time: string
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          position: number
          read_time?: string
          tag?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          position?: number
          read_time?: string
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          amount: number
          created_at: string
          id: string
          id_number: string
          id_type: string
          ssn_last4: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          id_number?: string
          id_type?: string
          ssn_last4?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          id_number?: string
          id_type?: string
          ssn_last4?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_by_admin: boolean
          read_by_user: boolean
          sender_id: string
          sender_role: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id: string
          sender_role?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id?: string
          sender_role?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          brand: string
          card_id: string | null
          created_at: string
          holder: string
          id: string
          last4: string
          method: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          brand?: string
          card_id?: string | null
          created_at?: string
          holder?: string
          id?: string
          last4?: string
          method?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          brand?: string
          card_id?: string | null
          created_at?: string
          holder?: string
          id?: string
          last4?: string
          method?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_id: string
          avatar: string
          balance: number
          created_at: string
          crypto_wallet: string
          email: string
          id: string
          interest_rate: number
          invested: number
          loan_balance: number
          monthly_gain: number
          nickname: string
          onboarded: boolean
          retirement_balance: number
          savings: number
          sectors: string[]
          updated_at: string
        }
        Insert: {
          account_id?: string
          avatar?: string
          balance?: number
          created_at?: string
          crypto_wallet?: string
          email?: string
          id: string
          interest_rate?: number
          invested?: number
          loan_balance?: number
          monthly_gain?: number
          nickname?: string
          onboarded?: boolean
          retirement_balance?: number
          savings?: number
          sectors?: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string
          avatar?: string
          balance?: number
          created_at?: string
          crypto_wallet?: string
          email?: string
          id?: string
          interest_rate?: number
          invested?: number
          loan_balance?: number
          monthly_gain?: number
          nickname?: string
          onboarded?: boolean
          retirement_balance?: number
          savings?: number
          sectors?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      savings_plans: {
        Row: {
          created_at: string
          id: string
          purposed_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purposed_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purposed_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          billing_address: string
          billing_city: string
          billing_state: string
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          holder: string
          id: string
          last4: string
          postal_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string
          billing_city?: string
          billing_state?: string
          brand?: string
          created_at?: string
          exp_month: number
          exp_year: number
          holder: string
          id?: string
          last4: string
          postal_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string
          billing_city?: string
          billing_state?: string
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          holder?: string
          id?: string
          last4?: string
          postal_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_btc_address: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_kind:
        | "deposit"
        | "withdrawal"
        | "savings"
        | "retirement"
        | "loan"
        | "card"
        | "investment"
      app_role: "admin" | "user"
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
      activity_kind: [
        "deposit",
        "withdrawal",
        "savings",
        "retirement",
        "loan",
        "card",
        "investment",
      ],
      app_role: ["admin", "user"],
    },
  },
} as const
