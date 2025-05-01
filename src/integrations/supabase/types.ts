export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          message_id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          message_id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          message_id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          finished: boolean
          id: string
          session_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finished?: boolean
          id?: string
          session_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finished?: boolean
          id?: string
          session_name?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          code: number
          company_description: string | null
          company_id: string
          company_name: string | null
        }
        Insert: {
          code: number
          company_description?: string | null
          company_id?: string
          company_name?: string | null
        }
        Update: {
          code?: number
          company_description?: string | null
          company_id?: string
          company_name?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          emoji_rating: string
          id: string
          review_text: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji_rating: string
          id?: string
          review_text?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji_rating?: string
          id?: string
          review_text?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      info_messages: {
        Row: {
          category: string
          content_dict: Json | null
          content_str: string | null
          created_at: string
          info_id: string
          message_id: string | null
        }
        Insert: {
          category: string
          content_dict?: Json | null
          content_str?: string | null
          created_at?: string
          info_id?: string
          message_id?: string | null
        }
        Update: {
          category?: string
          content_dict?: Json | null
          content_str?: string | null
          created_at?: string
          info_id?: string
          message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "info_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["message_id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string
          distilled_company_AIR_info: string | null
          distilled_user_AIR_info: string | null
          email: string | null
          onboarding_complete: boolean | null
          TTS_flag: boolean | null
          updated_at: string
          user_description: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          distilled_company_AIR_info?: string | null
          distilled_user_AIR_info?: string | null
          email?: string | null
          onboarding_complete?: boolean | null
          TTS_flag?: boolean | null
          updated_at?: string
          user_description?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          distilled_company_AIR_info?: string | null
          distilled_user_AIR_info?: string | null
          email?: string | null
          onboarding_complete?: boolean | null
          TTS_flag?: boolean | null
          updated_at?: string
          user_description?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
    }
    Views: {
      company_codes: {
        Row: {
          code: number | null
        }
        Insert: {
          code?: number | null
        }
        Update: {
          code?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      set_user_company: {
        Args: { user_uuid: string; company_code: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
