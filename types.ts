export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
export interface Database {
  public: {
    Tables: {
      monitoring_tool_submissions: {
        Row: {
          _app_user_id: string
          _attachments: Json
          _created: string
          _deleted: boolean
          _id: string
          _modified: string
          enketoEntry: Json
          formId: string
          json: Json
        }
        Insert: {
          _app_user_id: string
          _attachments: Json
          _created?: string
          _deleted?: boolean
          _id: string
          _modified?: string
          enketoEntry: Json
          formId: string
          json: Json
        }
        Update: {
          _app_user_id?: string
          _attachments?: Json
          _created?: string
          _deleted?: boolean
          _id?: string
          _modified?: string
          enketoEntry?: Json
          formId?: string
          json?: Json
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

 

 >  NX   Successfully ran target supabase for project picsa-server


   View logs and investigate cache misses at https://nx.app/runs/1j6P1W4IBb

