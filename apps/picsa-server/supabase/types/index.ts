export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          country_code: string | null
          date_modified: string
          district: string | null
          filename: string
          id: string
          language_code: string | null
          storage_file: string | null
          type: string | null
        }
        Insert: {
          country_code?: string | null
          date_modified: string
          district?: string | null
          filename: string
          id: string
          language_code?: string | null
          storage_file?: string | null
          type?: string | null
        }
        Update: {
          country_code?: string | null
          date_modified?: string
          district?: string | null
          filename?: string
          id?: string
          language_code?: string | null
          storage_file?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_forecasts_storage_file_fkey"
            columns: ["storage_file"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_forecasts_storage_file_fkey"
            columns: ["storage_file"]
            isOneToOne: false
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          },
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
            isOneToOne: false
            referencedRelation: "climate_stations"
            referencedColumns: ["station_id"]
          },
        ]
      }
      climate_station_crop_data: {
        Row: {
          created_at: string
          crop_id: number
          id: number
          length_lower: number | null
          length_upper: number | null
          station_id: number
          water_lower: number | null
          water_upper: number | null
        }
        Insert: {
          created_at?: string
          crop_id: number
          id?: number
          length_lower?: number | null
          length_upper?: number | null
          station_id: number
          water_lower?: number | null
          water_upper?: number | null
        }
        Update: {
          created_at?: string
          crop_id?: number
          id?: number
          length_lower?: number | null
          length_upper?: number | null
          station_id?: number
          water_lower?: number | null
          water_upper?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_station_crop_data_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crop_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_station_crop_data_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "climate_stations"
            referencedColumns: ["station_id"]
          },
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
      crop_data: {
        Row: {
          created_at: string
          crop: string
          id: number
          label: string | null
          length_lower: number
          length_upper: number
          variety: string
          water_lower: number
          water_upper: number
        }
        Insert: {
          created_at?: string
          crop: string
          id?: number
          label?: string | null
          length_lower: number
          length_upper: number
          variety: string
          water_lower: number
          water_upper: number
        }
        Update: {
          created_at?: string
          crop?: string
          id?: number
          label?: string | null
          length_lower?: number
          length_upper?: number
          variety?: string
          water_lower?: number
          water_upper?: number
        }
        Relationships: []
      }
      deployments: {
        Row: {
          access_key_md5: string | null
          configuration: Json
          country_code: string | null
          icon_path: string | null
          id: string
          label: string
          public: boolean
          variant: string | null
        }
        Insert: {
          access_key_md5?: string | null
          configuration?: Json
          country_code?: string | null
          icon_path?: string | null
          id: string
          label: string
          public?: boolean
          variant?: string | null
        }
        Update: {
          access_key_md5?: string | null
          configuration?: Json
          country_code?: string | null
          icon_path?: string | null
          id?: string
          label?: string
          public?: boolean
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_icon_path_fkey"
            columns: ["icon_path"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["path"]
          },
        ]
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
          cover_image: string | null
          created_at: string
          description: string | null
          enketo_definition: Json | null
          enketo_form: string | null
          enketo_model: string | null
          form_xlsx: string | null
          id: string
          summary_fields: Json[] | null
          title: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          enketo_definition?: Json | null
          enketo_form?: string | null
          enketo_model?: string | null
          form_xlsx?: string | null
          id: string
          summary_fields?: Json[] | null
          title: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          enketo_definition?: Json | null
          enketo_form?: string | null
          enketo_model?: string | null
          form_xlsx?: string | null
          id?: string
          summary_fields?: Json[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_forms_cover_image_fkey"
            columns: ["cover_image"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["path"]
          },
          {
            foreignKeyName: "monitoring_forms_form_xlsx_fkey"
            columns: ["form_xlsx"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["path"]
          },
        ]
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
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_cover_fkey"
            columns: ["storage_cover"]
            isOneToOne: false
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_file_fkey"
            columns: ["storage_file"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_storage_file_fkey"
            columns: ["storage_file"]
            isOneToOne: false
            referencedRelation: "storage_objects"
            referencedColumns: ["id"]
          },
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
      user_roles: {
        Row: {
          created_at: string
          deployment_id: string
          id: number
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }
        Insert: {
          created_at?: string
          deployment_id: string
          id?: number
          roles?: Database["public"]["Enums"]["app_role"][]
          user_id?: string
        }
        Update: {
          created_at?: string
          deployment_id?: string
          id?: number
          roles?: Database["public"]["Enums"]["app_role"][]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_user_roles_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          owner_id: string | null
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
          owner_id?: string | null
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
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      custom_access_token_hook: {
        Args: {
          event: Json
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "resources.viewer"
        | "resources.author"
        | "resources.admin"
        | "deployments.admin"
        | "translations.viewer"
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
          path: string | null
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
          path?: string | null
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
          path?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
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

