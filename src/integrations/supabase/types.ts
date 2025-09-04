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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_activity: {
        Row: {
          action: string
          blocked_user_id: string | null
          id: string
          timestamp: string
          username: string
        }
        Insert: {
          action: string
          blocked_user_id?: string | null
          id?: string
          timestamp?: string
          username: string
        }
        Update: {
          action?: string
          blocked_user_id?: string | null
          id?: string
          timestamp?: string
          username?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Update: {
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      guest_support_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_chat_sessions: {
        Row: {
          admin_id: string | null
          ended_at: string | null
          id: string
          last_activity: string
          session_status: string
          started_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          admin_id?: string | null
          ended_at?: string | null
          id?: string
          last_activity?: string
          session_status?: string
          started_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          admin_id?: string | null
          ended_at?: string | null
          id?: string
          last_activity?: string
          session_status?: string
          started_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          message_type: string
          priority: string
          status: string
          updated_at: string
          user_id: string
          user_name: string
          user_type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          message_type?: string
          priority?: string
          status?: string
          updated_at?: string
          user_id: string
          user_name: string
          user_type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          user_type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          password: string
          phone_number: string | null
          remaining_searches: number | null
          search_limit: number | null
          updated_at: string
          user_type: string
          username: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          password: string
          phone_number?: string | null
          remaining_searches?: number | null
          search_limit?: number | null
          updated_at?: string
          user_type: string
          username: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          password?: string
          phone_number?: string | null
          remaining_searches?: number | null
          search_limit?: number | null
          updated_at?: string
          user_type?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_admin: {
        Args: { password_input: string; username_input: string }
        Returns: Json
      }
      authenticate_admin_secure: {
        Args: { password_input: string; username_input: string }
        Returns: Json
      }
      authenticate_user_secure: {
        Args: { password_input: string; username_input: string }
        Returns: Json
      }
      delete_user_admin: {
        Args: { user_id_input: string }
        Returns: Json
      }
      get_all_users_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          created_at: string
          id: string
          phone_number: string
          remaining_searches: number
          search_limit: number
          updated_at: string
          user_type: string
          username: string
        }[]
      }
      get_user_for_auth: {
        Args: { username_input: string }
        Returns: {
          company_name: string
          id: string
          password: string
          phone_number: string
          remaining_searches: number
          search_limit: number
          user_type: string
          username: string
        }[]
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      update_admin_credentials: {
        Args: {
          current_password: string
          current_username: string
          new_password: string
          new_username: string
        }
        Returns: Json
      }
      update_user_searches_admin: {
        Args: { remaining_searches_input: number; user_id_input: string }
        Returns: Json
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
