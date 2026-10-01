// Generated from the remind-u-app Supabase project. Regenerate after schema changes.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_category_overrides: {
        Row: {
          category: string
          package_name: string
        }
        Insert: {
          category: string
          package_name: string
        }
        Update: {
          category?: string
          package_name?: string
        }
        Relationships: []
      }
      app_limits: {
        Row: {
          categories: string[]
          created_at: string
          enabled: boolean
          id: string
          name: string
          packages: string[]
          session_minutes: number
          sessions_per_day: number
          user_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          packages?: string[]
          session_minutes: number
          sessions_per_day: number
          user_id?: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          packages?: string[]
          session_minutes?: number
          sessions_per_day?: number
          user_id?: string
        }
        Relationships: []
      }
      app_rules: {
        Row: {
          created_at: string
          daily_limit_min: number | null
          enabled: boolean
          id: string
          label: string | null
          package_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit_min?: number | null
          enabled?: boolean
          id?: string
          label?: string | null
          package_name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          daily_limit_min?: number | null
          enabled?: boolean
          id?: string
          label?: string | null
          package_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string
          id: string
          intention: string
          limit_id: string | null
          outcome: string
          package_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intention?: string
          limit_id?: string | null
          outcome: string
          package_name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          intention?: string
          limit_id?: string | null
          outcome?: string
          package_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_limit_id_fkey"
            columns: ["limit_id"]
            isOneToOne: false
            referencedRelation: "app_limits"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          challenge_days: number | null
          completed_at: string | null
          created_at: string
          id: string
          is_active: boolean
          text: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          challenge_days?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Update: {
          challenge_days?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acquisition_creator: string | null
          acquisition_source: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          persona: string | null
          plan: string
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          acquisition_creator?: string | null
          acquisition_source?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          persona?: string | null
          plan?: string
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_creator?: string | null
          acquisition_source?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          persona?: string | null
          plan?: string
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
