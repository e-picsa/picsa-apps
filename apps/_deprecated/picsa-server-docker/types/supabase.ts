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
          form_id: string
          id: number
          json: Json
          kobo_response: string | null
          xml: string
          xml_hash: string
        }
        Insert: {
          created_at?: string | null
          form_id: string
          id?: number
          json: Json
          kobo_response?: string | null
          xml: string
          xml_hash: string
        }
        Update: {
          created_at?: string | null
          form_id?: string
          id?: number
          json?: Json
          kobo_response?: string | null
          xml?: string
          xml_hash?: string
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

