export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      climate_stations: {
        Row: {
          country_code: string;
          district: string | null;
          elevation: number | null;
          id: string | null;
          latitude: number | null;
          longitude: number | null;
          station_id: string;
          station_name: string | null;
        };
        Insert: {
          country_code: string;
          district?: string | null;
          elevation?: number | null;
          id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          station_id: string;
          station_name?: string | null;
        };
        Update: {
          country_code?: string;
          district?: string | null;
          elevation?: number | null;
          id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          station_id?: string;
          station_name?: string | null;
        };
        Relationships: [];
      };
      climate_summary_rainfall: {
        Row: {
          country_code: Database['public']['Enums']['country_code'];
          created_at: string;
          data: Json[];
          metadata: Json;
          station_id: string;
          updated_at: string;
        };
        Insert: {
          country_code: Database['public']['Enums']['country_code'];
          created_at?: string;
          data: Json[];
          metadata: Json;
          station_id: string;
          updated_at?: string;
        };
        Update: {
          country_code?: Database['public']['Enums']['country_code'];
          created_at?: string;
          data?: Json[];
          metadata?: Json;
          station_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'climate_summary_rainfall_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'climate_stations';
            referencedColumns: ['id'];
          }
        ];
      };
      crop_data: {
        Row: {
          additional_data: Json;
          additional_info: string | null;
          created_at: string;
          crop: string;
          days_lower: number;
          days_upper: number;
          id: string;
          maturity_period: string;
          updated_at: string;
          variety: string;
        };
        Insert: {
          additional_data?: Json;
          additional_info?: string | null;
          created_at?: string;
          crop: string;
          days_lower: number;
          days_upper: number;
          id?: string;
          maturity_period: string;
          updated_at?: string;
          variety: string;
        };
        Update: {
          additional_data?: Json;
          additional_info?: string | null;
          created_at?: string;
          crop?: string;
          days_lower?: number;
          days_upper?: number;
          id?: string;
          maturity_period?: string;
          updated_at?: string;
          variety?: string;
        };
        Relationships: [];
      };
      crop_data_downscaled: {
        Row: {
          country_code: string;
          created_at: string;
          id: string;
          location_id: string;
          override_data: Json;
          updated_at: string;
          water_requirements: Json;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          id?: string;
          location_id: string;
          override_data?: Json;
          updated_at?: string;
          water_requirements?: Json;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          id?: string;
          location_id?: string;
          override_data?: Json;
          updated_at?: string;
          water_requirements?: Json;
        };
        Relationships: [];
      };
      crop_station_data: {
        Row: {
          created_at: string;
          crop_id: string;
          days_lower: number;
          days_upper: number;
          probabilities: number[] | null;
          station_id: string;
          water_lower: number;
          water_upper: number;
        };
        Insert: {
          created_at?: string;
          crop_id: string;
          days_lower: number;
          days_upper: number;
          probabilities?: number[] | null;
          station_id: string;
          water_lower: number;
          water_upper: number;
        };
        Update: {
          created_at?: string;
          crop_id?: string;
          days_lower?: number;
          days_upper?: number;
          probabilities?: number[] | null;
          station_id?: string;
          water_lower?: number;
          water_upper?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'public_crop_station_data_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'climate_stations';
            referencedColumns: ['id'];
          }
        ];
      };
      deployments: {
        Row: {
          access_key_md5: string | null;
          configuration: Json;
          country_code: string;
          icon_path: string | null;
          id: string;
          label: string;
          public: boolean;
          variant: string | null;
        };
        Insert: {
          access_key_md5?: string | null;
          configuration?: Json;
          country_code: string;
          icon_path?: string | null;
          id: string;
          label: string;
          public?: boolean;
          variant?: string | null;
        };
        Update: {
          access_key_md5?: string | null;
          configuration?: Json;
          country_code?: string;
          icon_path?: string | null;
          id?: string;
          label?: string;
          public?: boolean;
          variant?: string | null;
        };
        Relationships: [];
      };
      forecasts: {
        Row: {
          country_code: string;
          created_at: string;
          forecast_type: Database['public']['Enums']['forecast_type'] | null;
          id: string;
          language_code: string | null;
          location: string[] | null;
          mimetype: string | null;
          storage_file: string | null;
          updated_at: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          forecast_type?: Database['public']['Enums']['forecast_type'] | null;
          id: string;
          language_code?: string | null;
          location?: string[] | null;
          mimetype?: string | null;
          storage_file?: string | null;
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          forecast_type?: Database['public']['Enums']['forecast_type'] | null;
          id?: string;
          language_code?: string | null;
          location?: string[] | null;
          mimetype?: string | null;
          storage_file?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      kobo_sync: {
        Row: {
          _created: string;
          _id: string;
          _modified: string;
          enketo_entry: Json | null;
          kobo_form_id: string | null;
          kobo_sync_required: boolean | null;
          kobo_sync_status: number | null;
          kobo_sync_time: string | null;
          kobo_uuid: string | null;
          operation: string;
        };
        Insert: {
          _created?: string;
          _id: string;
          _modified?: string;
          enketo_entry?: Json | null;
          kobo_form_id?: string | null;
          kobo_sync_required?: boolean | null;
          kobo_sync_status?: number | null;
          kobo_sync_time?: string | null;
          kobo_uuid?: string | null;
          operation: string;
        };
        Update: {
          _created?: string;
          _id?: string;
          _modified?: string;
          enketo_entry?: Json | null;
          kobo_form_id?: string | null;
          kobo_sync_required?: boolean | null;
          kobo_sync_status?: number | null;
          kobo_sync_time?: string | null;
          kobo_uuid?: string | null;
          operation?: string;
        };
        Relationships: [];
      };
      monitoring_forms: {
        Row: {
          cover_image: string | null;
          created_at: string;
          description: string | null;
          enketo_definition: Json | null;
          enketo_form: string | null;
          enketo_model: string | null;
          form_xlsx: string | null;
          id: string;
          summary_fields: Json[] | null;
          title: string;
        };
        Insert: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          enketo_definition?: Json | null;
          enketo_form?: string | null;
          enketo_model?: string | null;
          form_xlsx?: string | null;
          id: string;
          summary_fields?: Json[] | null;
          title: string;
        };
        Update: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          enketo_definition?: Json | null;
          enketo_form?: string | null;
          enketo_model?: string | null;
          form_xlsx?: string | null;
          id?: string;
          summary_fields?: Json[] | null;
          title?: string;
        };
        Relationships: [];
      };
      monitoring_tool_submissions: {
        Row: {
          _app_user_id: string;
          _attachments: Json;
          _created: string;
          _deleted: boolean;
          _id: string;
          _modified: string;
          enketoEntry: Json;
          formId: string;
          json: Json;
        };
        Insert: {
          _app_user_id: string;
          _attachments: Json;
          _created?: string;
          _deleted?: boolean;
          _id: string;
          _modified?: string;
          enketoEntry: Json;
          formId: string;
          json: Json;
        };
        Update: {
          _app_user_id?: string;
          _attachments?: Json;
          _created?: string;
          _deleted?: boolean;
          _id?: string;
          _modified?: string;
          enketoEntry?: Json;
          formId?: string;
          json?: Json;
        };
        Relationships: [];
      };
      resource_collections: {
        Row: {
          collection_parent: string | null;
          cover_image: string | null;
          created_at: string;
          description: string | null;
          id: string;
          modified_at: string;
          resource_collections: string[] | null;
          resource_files: string[] | null;
          resource_links: string[] | null;
          sort_order: number;
          title: string;
        };
        Insert: {
          collection_parent?: string | null;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          modified_at?: string;
          resource_collections?: string[] | null;
          resource_files?: string[] | null;
          resource_links?: string[] | null;
          sort_order?: number;
          title: string;
        };
        Update: {
          collection_parent?: string | null;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          modified_at?: string;
          resource_collections?: string[] | null;
          resource_files?: string[] | null;
          resource_links?: string[] | null;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      resource_files: {
        Row: {
          country_code: Database['public']['Enums']['country_code'];
          cover_image: string | null;
          created_at: string;
          description: string | null;
          external_url: string | null;
          filename: string | null;
          id: string;
          language_code: string | null;
          md5_checksum: string | null;
          mimetype: string | null;
          modified_at: string;
          size_kb: number | null;
          sort_order: number;
          storage_file: string | null;
          title: string | null;
        };
        Insert: {
          country_code?: Database['public']['Enums']['country_code'];
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          filename?: string | null;
          id?: string;
          language_code?: string | null;
          md5_checksum?: string | null;
          mimetype?: string | null;
          modified_at?: string;
          size_kb?: number | null;
          sort_order?: number;
          storage_file?: string | null;
          title?: string | null;
        };
        Update: {
          country_code?: Database['public']['Enums']['country_code'];
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          filename?: string | null;
          id?: string;
          language_code?: string | null;
          md5_checksum?: string | null;
          mimetype?: string | null;
          modified_at?: string;
          size_kb?: number | null;
          sort_order?: number;
          storage_file?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      resource_files_child: {
        Row: {
          country_code: Database['public']['Enums']['country_code'];
          cover_image: string | null;
          created_at: string;
          description: string | null;
          external_url: string | null;
          filename: string | null;
          id: string;
          language_code: string | null;
          md5_checksum: string | null;
          mimetype: string | null;
          modified_at: string;
          resource_file_id: string;
          size_kb: number | null;
          sort_order: number;
          storage_file: string | null;
          title: string | null;
        };
        Insert: {
          country_code?: Database['public']['Enums']['country_code'];
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          filename?: string | null;
          id?: string;
          language_code?: string | null;
          md5_checksum?: string | null;
          mimetype?: string | null;
          modified_at?: string;
          resource_file_id: string;
          size_kb?: number | null;
          sort_order?: number;
          storage_file?: string | null;
          title?: string | null;
        };
        Update: {
          country_code?: Database['public']['Enums']['country_code'];
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          filename?: string | null;
          id?: string;
          language_code?: string | null;
          md5_checksum?: string | null;
          mimetype?: string | null;
          modified_at?: string;
          resource_file_id?: string;
          size_kb?: number | null;
          sort_order?: number;
          storage_file?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_resource_files_child_resource_file_id_fkey';
            columns: ['resource_file_id'];
            isOneToOne: false;
            referencedRelation: 'resource_files';
            referencedColumns: ['id'];
          }
        ];
      };
      resource_links: {
        Row: {
          cover_image: string | null;
          created_at: string;
          description: string | null;
          id: string;
          modified_at: string;
          sort_order: number;
          title: string | null;
          type: Database['public']['Enums']['resource_link_type'];
          url: string;
        };
        Insert: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          modified_at?: string;
          sort_order?: number;
          title?: string | null;
          type: Database['public']['Enums']['resource_link_type'];
          url: string;
        };
        Update: {
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          modified_at?: string;
          sort_order?: number;
          title?: string | null;
          type?: Database['public']['Enums']['resource_link_type'];
          url?: string;
        };
        Relationships: [];
      };
      translations: {
        Row: {
          archived: boolean | null;
          context: string | null;
          created_at: string;
          id: string;
          ke_sw: string | null;
          mw_ny: string | null;
          text: string;
          tj_tg: string | null;
          tool: string;
          zm_ny: string | null;
        };
        Insert: {
          archived?: boolean | null;
          context?: string | null;
          created_at?: string;
          id: string;
          ke_sw?: string | null;
          mw_ny?: string | null;
          text: string;
          tj_tg?: string | null;
          tool: string;
          zm_ny?: string | null;
        };
        Update: {
          archived?: boolean | null;
          context?: string | null;
          created_at?: string;
          id?: string;
          ke_sw?: string | null;
          mw_ny?: string | null;
          text?: string;
          tj_tg?: string | null;
          tool?: string;
          zm_ny?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          deployment_id: string;
          roles: Database['public']['Enums']['app_role'][];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deployment_id: string;
          roles?: Database['public']['Enums']['app_role'][];
          user_id?: string;
        };
        Update: {
          created_at?: string;
          deployment_id?: string;
          roles?: Database['public']['Enums']['app_role'][];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'public_user_roles_deployment_id_fkey';
            columns: ['deployment_id'];
            isOneToOne: false;
            referencedRelation: 'deployments';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      storage_objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string | null;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string | null;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string | null;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      call_edge_function: {
        Args: { name: string; body: Json };
        Returns: number;
      };
      custom_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
    };
    Enums: {
      app_role:
        | 'viewer'
        | 'author'
        | 'admin'
        | 'resources.viewer'
        | 'resources.author'
        | 'resources.admin'
        | 'deployments.viewer'
        | 'deployments.author'
        | 'deployments.admin'
        | 'translations.viewer'
        | 'translations.author'
        | 'translations.admin';
      country_code: 'global' | 'mw' | 'zm' | 'tj';
      forecast_type: 'daily' | 'seasonal' | 'downscaled';
      locale_code: 'global_en' | 'mw_ny' | 'mw_tum' | 'zm_ny' | 'tj_tg';
      resource_link_type: 'app' | 'social' | 'web';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      prefixes: {
        Row: {
          bucket_id: string;
          created_at: string | null;
          level: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string | null;
          level?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string | null;
          level?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          }
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string };
        Returns: undefined;
      };
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json };
        Returns: undefined;
      };
      delete_prefix: {
        Args: { _bucket_id: string; _name: string };
        Returns: boolean;
      };
      extension: {
        Args: { name: string };
        Returns: string;
      };
      filename: {
        Args: { name: string };
        Returns: string;
      };
      foldername: {
        Args: { name: string };
        Returns: string[];
      };
      get_level: {
        Args: { name: string };
        Returns: number;
      };
      get_prefix: {
        Args: { name: string };
        Returns: string;
      };
      get_prefixes: {
        Args: { name: string };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_legacy_v1: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_v1_optimised: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_v2: {
        Args: {
          prefix: string;
          bucket_name: string;
          limits?: number;
          levels?: number;
          start_after?: string;
        };
        Returns: {
          key: string;
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        'viewer',
        'author',
        'admin',
        'resources.viewer',
        'resources.author',
        'resources.admin',
        'deployments.viewer',
        'deployments.author',
        'deployments.admin',
        'translations.viewer',
        'translations.author',
        'translations.admin',
      ],
      country_code: ['global', 'mw', 'zm', 'tj'],
      forecast_type: ['daily', 'seasonal', 'downscaled'],
      locale_code: ['global_en', 'mw_ny', 'mw_tum', 'zm_ny', 'tj_tg'],
      resource_link_type: ['app', 'social', 'web'],
    },
  },
  storage: {
    Enums: {},
  },
} as const;
