export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      download_otps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          otp_code: string
          share_token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          otp_code: string
          share_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          otp_code?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_otps_share_token_fkey"
            columns: ["share_token"]
            isOneToOne: false
            referencedRelation: "file_shares"
            referencedColumns: ["share_token"]
          },
        ]
      }
      file_shares: {
        Row: {
          created_at: string
          download_count: number | null
          download_limit: number | null
          expires_at: string | null
          file_id: string
          id: string
          is_active: boolean | null
          password_protected: boolean | null
          share_password: string | null
          share_token: string
          shared_by: string
        }
        Insert: {
          created_at?: string
          download_count?: number | null
          download_limit?: number | null
          expires_at?: string | null
          file_id: string
          id?: string
          is_active?: boolean | null
          password_protected?: boolean | null
          share_password?: string | null
          share_token: string
          shared_by: string
        }
        Update: {
          created_at?: string
          download_count?: number | null
          download_limit?: number | null
          expires_at?: string | null
          file_id?: string
          id?: string
          is_active?: boolean | null
          password_protected?: boolean | null
          share_password?: string | null
          share_token?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          deleted_at: string | null
          download_count: number | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_deleted: boolean | null
          is_shared: boolean | null
          mime_type: string | null
          name: string
          original_name: string
          requires_otp: boolean | null
          share_password: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          download_count?: number | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_deleted?: boolean | null
          is_shared?: boolean | null
          mime_type?: string | null
          name: string
          original_name: string
          requires_otp?: boolean | null
          share_password?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          download_count?: number | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_deleted?: boolean | null
          is_shared?: boolean | null
          mime_type?: string | null
          name?: string
          original_name?: string
          requires_otp?: boolean | null
          share_password?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          processed: boolean | null
          published_at: string
          source_name: string
          source_url: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          processed?: boolean | null
          published_at: string
          source_name: string
          source_url: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          processed?: boolean | null
          published_at?: string
          source_name?: string
          source_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          article_id: string | null
          created_at: string
          error_message: string | null
          hashtags: string[]
          id: string
          posted_at: string | null
          status: string
          tweet_content: string
          tweet_id: string | null
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          error_message?: string | null
          hashtags: string[]
          id?: string
          posted_at?: string | null
          status?: string
          tweet_content: string
          tweet_id?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          error_message?: string | null
          hashtags?: string[]
          id?: string
          posted_at?: string | null
          status?: string
          tweet_content?: string
          tweet_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          name: string
          rss_feed: string | null
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name: string
          rss_feed?: string | null
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name?: string
          rss_feed?: string | null
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          storage_limit: number | null
          storage_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
