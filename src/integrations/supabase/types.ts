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
      inbox_players: {
        Row: {
          created_at: string
          id: string
          name: string
          nationality: string | null
          notes: string | null
          position: string | null
          scout_id: string
          shirt_number: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          nationality?: string | null
          notes?: string | null
          position?: string | null
          scout_id: string
          shirt_number?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          nationality?: string | null
          notes?: string | null
          position?: string | null
          scout_id?: string
          shirt_number?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      match_players: {
        Row: {
          created_at: string
          id: string
          match_id: string
          name: string
          observation_id: string | null
          position: string | null
          shirt_number: string | null
          team: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          name: string
          observation_id?: string | null
          position?: string | null
          shirt_number?: string | null
          team: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          name?: string
          observation_id?: string | null
          position?: string | null
          shirt_number?: string | null
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team: string
          created_at: string
          date: string
          home_team: string
          id: string
          location: string | null
          name: string
          notes: string | null
          scout_id: string
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          away_team: string
          created_at?: string
          date: string
          home_team: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          scout_id: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          away_team?: string
          created_at?: string
          date?: string
          home_team?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          scout_id?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          created_at: string
          date: string
          id: string
          location: string | null
          match_id: string | null
          notes: string | null
          player_id: string
          updated_at: string
          video_link: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          location?: string | null
          match_id?: string | null
          notes?: string | null
          player_id: string
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          match_id?: string | null
          notes?: string | null
          player_id?: string
          updated_at?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          player_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          player_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_attachments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_shortlists: {
        Row: {
          added_at: string
          display_order: number
          id: string
          player_id: string
          shortlist_id: string
        }
        Insert: {
          added_at?: string
          display_order?: number
          id?: string
          player_id: string
          shortlist_id: string
        }
        Update: {
          added_at?: string
          display_order?: number
          id?: string
          player_id?: string
          shortlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_shortlists_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_shortlists_shortlist_id_fkey"
            columns: ["shortlist_id"]
            isOneToOne: false
            referencedRelation: "shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          agency: string | null
          agency_link: string | null
          appearances: number | null
          assists: number | null
          ceiling_level: string | null
          contract_expires: string | null
          created_at: string
          current_salary: string | null
          date_of_birth: string | null
          estimated_value: string | null
          estimated_value_numeric: number | null
          expected_salary: string | null
          foot: string | null
          football_data_id: number | null
          goals: number | null
          height: number | null
          id: string
          minutes_played: number | null
          name: string
          nationality: string | null
          photo_url: string | null
          position: string | null
          profile_summary: string | null
          recommendation: string | null
          risks: string[] | null
          scout_id: string
          scout_notes: string | null
          sell_on_potential: number | null
          shirt_number: string | null
          stats_last_updated: string | null
          strengths: string[] | null
          tags: string[] | null
          team: string | null
          transfer_potential_comment: string | null
          updated_at: string
          video_link: string | null
          weaknesses: string[] | null
          weight: number | null
        }
        Insert: {
          agency?: string | null
          agency_link?: string | null
          appearances?: number | null
          assists?: number | null
          ceiling_level?: string | null
          contract_expires?: string | null
          created_at?: string
          current_salary?: string | null
          date_of_birth?: string | null
          estimated_value?: string | null
          estimated_value_numeric?: number | null
          expected_salary?: string | null
          foot?: string | null
          football_data_id?: number | null
          goals?: number | null
          height?: number | null
          id?: string
          minutes_played?: number | null
          name: string
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          profile_summary?: string | null
          recommendation?: string | null
          risks?: string[] | null
          scout_id: string
          scout_notes?: string | null
          sell_on_potential?: number | null
          shirt_number?: string | null
          stats_last_updated?: string | null
          strengths?: string[] | null
          tags?: string[] | null
          team?: string | null
          transfer_potential_comment?: string | null
          updated_at?: string
          video_link?: string | null
          weaknesses?: string[] | null
          weight?: number | null
        }
        Update: {
          agency?: string | null
          agency_link?: string | null
          appearances?: number | null
          assists?: number | null
          ceiling_level?: string | null
          contract_expires?: string | null
          created_at?: string
          current_salary?: string | null
          date_of_birth?: string | null
          estimated_value?: string | null
          estimated_value_numeric?: number | null
          expected_salary?: string | null
          foot?: string | null
          football_data_id?: number | null
          goals?: number | null
          height?: number | null
          id?: string
          minutes_played?: number | null
          name?: string
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          profile_summary?: string | null
          recommendation?: string | null
          risks?: string[] | null
          scout_id?: string
          scout_notes?: string | null
          sell_on_potential?: number | null
          shirt_number?: string | null
          stats_last_updated?: string | null
          strengths?: string[] | null
          tags?: string[] | null
          team?: string | null
          transfer_potential_comment?: string | null
          updated_at?: string
          video_link?: string | null
          weaknesses?: string[] | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "scouts"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          observation_id: string
          parameter: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          observation_id: string
          parameter: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          observation_id?: string
          parameter?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_preferences: {
        Row: {
          created_at: string
          default_inbox_sort: string | null
          default_player_sort: string | null
          default_tournament_sort: string | null
          id: string
          scout_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_inbox_sort?: string | null
          default_player_sort?: string | null
          default_tournament_sort?: string | null
          id?: string
          scout_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_inbox_sort?: string | null
          default_player_sort?: string | null
          default_tournament_sort?: string | null
          id?: string
          scout_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scouts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scout_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scout_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scout_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          away_team: string | null
          created_at: string
          home_team: string | null
          id: string
          match_date: string
          name: string
          notes: string | null
          tournament_id: string
        }
        Insert: {
          away_team?: string | null
          created_at?: string
          home_team?: string | null
          id?: string
          match_date: string
          name: string
          notes?: string | null
          tournament_id: string
        }
        Update: {
          away_team?: string | null
          created_at?: string
          home_team?: string | null
          id?: string
          match_date?: string
          name?: string
          notes?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_players: {
        Row: {
          average_rating: number | null
          created_at: string
          id: string
          match_id: string | null
          name: string
          nationality: string | null
          notes: string | null
          observation_count: number | null
          position: string | null
          rating: number | null
          shirt_number: string | null
          team: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          id?: string
          match_id?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          observation_count?: number | null
          position?: string | null
          rating?: number | null
          shirt_number?: string | null
          team?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          id?: string
          match_id?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          observation_count?: number | null
          position?: string | null
          rating?: number | null
          shirt_number?: string | null
          team?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          end_date: string
          id: string
          location: string | null
          name: string
          notes: string | null
          scout_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          scout_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          scout_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      parse_estimated_value: { Args: { value_text: string }; Returns: number }
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
