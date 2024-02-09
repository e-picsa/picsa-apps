export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      climate_forecasts: {
        Row: {
          country: string | null
          date_modified: string
          district: string | null
          filename: string
          id: string
          language: string
          storage_file: string | null
          type: string | null
        }
        Insert: {
          country?: string | null
          date_modified: string
          district?: string | null
          filename: string
          id: string
          language: string
          storage_file?: string | null
          type?: string | null
        }
        Update: {
          country?: string | null
          date_modified?: string
          district?: string | null
          filename?: string
          id?: string
          language?: string
          storage_file?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_forecasts_storage_file_fkey"
            columns: ["storage_file"]
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_forecasts_storage_file_fkey"
            columns: ["storage_file"]
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          }
        ]
      }
      climate_products: {
        Row: {
          created_at: string
          data: Json
          station_id: number
          type: string
        }
        Insert: {
          created_at?: string
          data: Json
          station_id: number
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          station_id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_products_station_id_fkey"
            columns: ["station_id"]
            referencedRelation: "climate_stations"
            referencedColumns: ["station_id"]
          }
        ]
      }
      climate_stations: {
        Row: {
          country_code: string | null
          district: string | null
          elevation: number | null
          latitude: number | null
          longitude: number | null
          station_id: number
          station_name: string | null
        }
        Insert: {
          country_code?: string | null
          district?: string | null
          elevation?: number | null
          latitude?: number | null
          longitude?: number | null
          station_id?: number
          station_name?: string | null
        }
        Update: {
          country_code?: string | null
          district?: string | null
          elevation?: number | null
          latitude?: number | null
          longitude?: number | null
          station_id?: number
          station_name?: string | null
        }
        Relationships: []
      }
      kobo_sync: {
        Row: {
          _created: string
          _id: string
          _modified: string
          enketo_entry: Json | null
          kobo_form_id: string | null
          kobo_sync_required: boolean | null
          kobo_sync_status: number | null
          kobo_sync_time: string | null
          kobo_uuid: string | null
          operation: string
        }
        Insert: {
          _created?: string
          _id: string
          _modified?: string
          enketo_entry?: Json | null
          kobo_form_id?: string | null
          kobo_sync_required?: boolean | null
          kobo_sync_status?: number | null
          kobo_sync_time?: string | null
          kobo_uuid?: string | null
          operation: string
        }
        Update: {
          _created?: string
          _id?: string
          _modified?: string
          enketo_entry?: Json | null
          kobo_form_id?: string | null
          kobo_sync_required?: boolean | null
          kobo_sync_status?: number | null
          kobo_sync_time?: string | null
          kobo_uuid?: string | null
          operation?: string
        }
        Relationships: []
      }
      monitoring_forms: {
        Row: {
          appCountries: string[] | null
          cover: Json | null
          created_at: string
          description: string | null
          enketoDefinition: Json | null
          enketoForm: string | null
          enketoModel: string | null
          id: number
          summaryFields: Json[] | null
          title: string
        }
        Insert: {
          appCountries?: string[] | null
          cover?: Json | null
          created_at?: string
          description?: string | null
          enketoDefinition?: Json | null
          enketoForm?: string | null
          enketoModel?: string | null
          id?: number
          summaryFields?: Json[] | null
          tittle: string
        }
        Update: {
          appCountries?: string[] | null
          cover?: Json | null
          created_at?: string
          description?: string | null
          enketoDefinition?: Json | null
          enketoForm?: string | null
          enketoModel?: string | null
          id?: number
          summaryFields?: Json[] | null
          tittle?: string
        }
        Relationships: []
      }
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
      resources: {
        Row: {
          created_at: string
          description: string
          id: string
          modified_at: string
          storage_cover: string | null
          storage_file: string | null
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          modified_at?: string
          storage_cover?: string | null
          storage_file?: string | null
          title?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          modified_at?: string
          storage_cover?: string | null
          storage_file?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_storage_cover_fkey"
            columns: ["storage_cover"]
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_cover_fkey"
            columns: ["storage_cover"]
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_file_fkey"
            columns: ["storage_file"]
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_file_fkey"
            columns: ["storage_file"]
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          }
        ]
      }
      translations: {
        Row: {
          context: string | null
          created_at: string
          en: string
          id: string
          ke_sw: string | null
          mw_ny: string | null
          tj_tg: string | null
          tool: string
          zm_ny: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          en: string
          id: string
          ke_sw?: string | null
          mw_ny?: string | null
          tj_tg?: string | null
          tool: string
          zm_ny?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          en?: string
          id?: string
          ke_sw?: string | null
          mw_ny?: string | null
          tj_tg?: string | null
          tool?: string
          zm_ny?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      storage_objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string | null
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

