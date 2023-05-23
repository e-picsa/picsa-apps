export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      monitoring_tool_submissions: {
        Row: {
          created_at: string | null
          id: number
          json: Json | null
          xml: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          json?: Json | null
          xml?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          json?: Json | null
          xml?: string | null
        }
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

