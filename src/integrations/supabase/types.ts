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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
          current_phase: Database["public"]["Enums"]["interview_phase"] | null
          finished: boolean
          id: string
          phase_max_questions: Json | null
          phase_metadata: Json | null
          phase_question_counts: Json | null
          selected_themes: Json | null
          session_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_phase?: Database["public"]["Enums"]["interview_phase"] | null
          finished?: boolean
          id?: string
          phase_max_questions?: Json | null
          phase_metadata?: Json | null
          phase_question_counts?: Json | null
          selected_themes?: Json | null
          session_name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_phase?: Database["public"]["Enums"]["interview_phase"] | null
          finished?: boolean
          id?: string
          phase_max_questions?: Json | null
          phase_metadata?: Json | null
          phase_question_counts?: Json | null
          selected_themes?: Json | null
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
          user_id: string | null
        }
        Insert: {
          category: string
          content_dict?: Json | null
          content_str?: string | null
          created_at?: string
          info_id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          content_dict?: Json | null
          content_str?: string | null
          created_at?: string
          info_id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_info_messages_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "info_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["message_id"]
          },
        ]
      }
      interview_phases_config: {
        Row: {
          completion_threshold: number | null
          created_at: string | null
          id: string
          max_questions: number
          phase: Database["public"]["Enums"]["interview_phase"]
          phase_description: string | null
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          completion_threshold?: number | null
          created_at?: string | null
          id?: string
          max_questions: number
          phase: Database["public"]["Enums"]["interview_phase"]
          phase_description?: string | null
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          completion_threshold?: number | null
          created_at?: string | null
          id?: string
          max_questions?: number
          phase?: Database["public"]["Enums"]["interview_phase"]
          phase_description?: string | null
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          company_id: string | null
          consultation_history: Json | null
          created_at: string
          distilled_company_AIR_info: string | null
          distilled_user_AIR_info: string | null
          email: string | null
          onboarding_complete: boolean | null
          preferred_themes: string[] | null
          theme_expertise: Json | null
          TTS_flag: boolean | null
          updated_at: string
          user_description: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          consultation_history?: Json | null
          created_at?: string
          distilled_company_AIR_info?: string | null
          distilled_user_AIR_info?: string | null
          email?: string | null
          onboarding_complete?: boolean | null
          preferred_themes?: string[] | null
          theme_expertise?: Json | null
          TTS_flag?: boolean | null
          updated_at?: string
          user_description?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          consultation_history?: Json | null
          created_at?: string
          distilled_company_AIR_info?: string | null
          distilled_user_AIR_info?: string | null
          email?: string | null
          onboarding_complete?: boolean | null
          preferred_themes?: string[] | null
          theme_expertise?: Json | null
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      interview_phase:
        | "introduction"
        | "theme_selection"
        | "deep_dive"
        | "summary"
        | "recommendations"
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
      interview_phase: [
        "introduction",
        "theme_selection",
        "deep_dive",
        "summary",
        "recommendations",
      ],
    },
  },
} as const
