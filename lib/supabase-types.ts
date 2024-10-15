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
      exams: {
        Row: {
          confidence: number | null
          confidence_goal: number | null
          created_at: string
          exam_date: string
          id: string
          last_studied: string
          name: string
          priority: number | null
          subject_id: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          confidence_goal?: number | null
          created_at?: string
          exam_date: string
          id?: string
          last_studied?: string
          name: string
          priority?: number | null
          subject_id: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          confidence_goal?: number | null
          created_at?: string
          exam_date?: string
          id?: string
          last_studied?: string
          name?: string
          priority?: number | null
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      studied_exam_entry: {
        Row: {
          confidence_increase: number
          date_studied: string
          exam_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          confidence_increase: number
          date_studied: string
          exam_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          confidence_increase?: number
          date_studied?: string
          exam_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_entries_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      studied_subtopic_entry: {
        Row: {
          confidence_increase: number | null
          date_studied: string | null
          id: string
          subtopic_id: string | null
        }
        Insert: {
          confidence_increase?: number | null
          date_studied?: string | null
          id?: string
          subtopic_id?: string | null
        }
        Update: {
          confidence_increase?: number | null
          date_studied?: string | null
          id?: string
          subtopic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studied_subtopic_entry_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      studied_topic_entry: {
        Row: {
          confidence_increase: number
          date_studied: string
          id: string
          topic_id: string | null
        }
        Insert: {
          confidence_increase: number
          date_studied: string
          id?: string
          topic_id?: string | null
        }
        Update: {
          confidence_increase?: number
          date_studied?: string
          id?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studied_topic_entry_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          subject_name: string | null
          user_id: string
        }
        Insert: {
          id?: string
          subject_name?: string | null
          user_id: string
        }
        Update: {
          id?: string
          subject_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          confidence: number | null
          id: string
          last_studied: string
          name: string
          order: number
          priority: number | null
          topic_id: string
        }
        Insert: {
          confidence?: number | null
          id?: string
          last_studied: string
          name: string
          order?: number
          priority?: number | null
          topic_id: string
        }
        Update: {
          confidence?: number | null
          id?: string
          last_studied?: string
          name?: string
          order?: number
          priority?: number | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          confidence: number | null
          exam_id: string
          id: string
          last_studied: string
          name: string
          order: number
          priority: number | null
        }
        Insert: {
          confidence?: number | null
          exam_id: string
          id?: string
          last_studied?: string
          name: string
          order?: number
          priority?: number | null
        }
        Update: {
          confidence?: number | null
          exam_id?: string
          id?: string
          last_studied?: string
          name?: string
          order?: number
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
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
      study_material_type: "subtopic" | "topic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
