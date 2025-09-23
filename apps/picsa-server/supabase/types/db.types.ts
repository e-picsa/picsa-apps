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
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
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
      app_users: {
        Row: {
          app_version: string | null;
          country_code: string | null;
          created_at: string;
          label: string | null;
          language_code: string | null;
          platform: string | null;
          updated_at: string;
          user_id: string;
          user_type: string | null;
        };
        Insert: {
          app_version?: string | null;
          country_code?: string | null;
          created_at?: string;
          label?: string | null;
          language_code?: string | null;
          platform?: string | null;
          updated_at?: string;
          user_id: string;
          user_type?: string | null;
        };
        Update: {
          app_version?: string | null;
          country_code?: string | null;
          created_at?: string;
          label?: string | null;
          language_code?: string | null;
          platform?: string | null;
          updated_at?: string;
          user_id?: string;
          user_type?: string | null;
        };
        Relationships: [];
      };
      climate_station_data: {
        Row: {
          annual_rainfall_data: Json[] | null;
          annual_rainfall_metadata: Json | null;
          annual_temperature_data: Json[] | null;
          annual_temperature_metadata: Json | null;
          comments: Json[];
          country_code: Database['public']['Enums']['country_code'];
          created_at: string;
          crop_probability_data: Json[] | null;
          crop_probability_metadata: Json | null;
          extremes_data: Json[] | null;
          extremes_metadata: Json | null;
          monthly_temperature_data: Json[] | null;
          monthly_temperature_metadata: Json | null;
          season_start_data: Json[] | null;
          season_start_metadata: Json | null;
          station_id: string;
          updated_at: string;
        };
        Insert: {
          annual_rainfall_data?: Json[] | null;
          annual_rainfall_metadata?: Json | null;
          annual_temperature_data?: Json[] | null;
          annual_temperature_metadata?: Json | null;
          comments?: Json[];
          country_code: Database['public']['Enums']['country_code'];
          created_at?: string;
          crop_probability_data?: Json[] | null;
          crop_probability_metadata?: Json | null;
          extremes_data?: Json[] | null;
          extremes_metadata?: Json | null;
          monthly_temperature_data?: Json[] | null;
          monthly_temperature_metadata?: Json | null;
          season_start_data?: Json[] | null;
          season_start_metadata?: Json | null;
          station_id: string;
          updated_at?: string;
        };
        Update: {
          annual_rainfall_data?: Json[] | null;
          annual_rainfall_metadata?: Json | null;
          annual_temperature_data?: Json[] | null;
          annual_temperature_metadata?: Json | null;
          comments?: Json[];
          country_code?: Database['public']['Enums']['country_code'];
          created_at?: string;
          crop_probability_data?: Json[] | null;
          crop_probability_metadata?: Json | null;
          extremes_data?: Json[] | null;
          extremes_metadata?: Json | null;
          monthly_temperature_data?: Json[] | null;
          monthly_temperature_metadata?: Json | null;
          season_start_data?: Json[] | null;
          season_start_metadata?: Json | null;
          station_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'climate_station_data_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'climate_stations';
            referencedColumns: ['id'];
          },
        ];
      };
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
          station_id: string | null;
          updated_at: string;
          water_requirements: Json;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          id?: string;
          location_id: string;
          override_data?: Json;
          station_id?: string | null;
          updated_at?: string;
          water_requirements?: Json;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          id?: string;
          location_id?: string;
          override_data?: Json;
          station_id?: string | null;
          updated_at?: string;
          water_requirements?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'crop_data_downscaled_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'climate_stations';
            referencedColumns: ['id'];
          },
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
        Relationships: [
          {
            foreignKeyName: 'deployments_icon_path_fkey';
            columns: ['icon_path'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
      };
      forecasts: {
        Row: {
          country_code: string;
          created_at: string;
          forecast_type: Database['public']['Enums']['forecast_type'] | null;
          id: string;
          label: string | null;
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
          label?: string | null;
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
          label?: string | null;
          language_code?: string | null;
          location?: string[] | null;
          mimetype?: string | null;
          storage_file?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'forecasts_storage_file_fkey';
            columns: ['storage_file'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'monitoring_forms_cover_image_fkey';
            columns: ['cover_image'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
          {
            foreignKeyName: 'monitoring_forms_form_xlsx_fkey';
            columns: ['form_xlsx'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
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
          country_code: Database['public']['Enums']['country_code'] | null;
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
          country_code?: Database['public']['Enums']['country_code'] | null;
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
          country_code?: Database['public']['Enums']['country_code'] | null;
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
        Relationships: [
          {
            foreignKeyName: 'resource_collections_cover_image_fkey';
            columns: ['cover_image'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'resource_files_cover_image_fkey';
            columns: ['cover_image'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
          {
            foreignKeyName: 'resource_files_storage_file_fkey';
            columns: ['storage_file'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
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
          },
          {
            foreignKeyName: 'resource_files_child_cover_image_fkey';
            columns: ['cover_image'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
          {
            foreignKeyName: 'resource_files_child_storage_file_fkey';
            columns: ['storage_file'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
      };
      resource_links: {
        Row: {
          country_code: Database['public']['Enums']['country_code'] | null;
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
          country_code?: Database['public']['Enums']['country_code'] | null;
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
          country_code?: Database['public']['Enums']['country_code'] | null;
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
        Relationships: [
          {
            foreignKeyName: 'resource_links_cover_image_fkey';
            columns: ['cover_image'];
            isOneToOne: false;
            referencedRelation: 'storage_objects';
            referencedColumns: ['path'];
          },
        ];
      };
      storage_objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          path: string | null;
          updated_at: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path?: string | null;
          updated_at?: string | null;
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
          mw_tum: string | null;
          text: string;
          tj_tg: string | null;
          tool: string;
          updated_at: string | null;
          zm_bem: string | null;
          zm_kqn: string | null;
          zm_loz: string | null;
          zm_lue: string | null;
          zm_lun: string | null;
          zm_ny: string | null;
          zm_toi: string | null;
        };
        Insert: {
          archived?: boolean | null;
          context?: string | null;
          created_at?: string;
          id: string;
          ke_sw?: string | null;
          mw_ny?: string | null;
          mw_tum?: string | null;
          text: string;
          tj_tg?: string | null;
          tool: string;
          updated_at?: string | null;
          zm_bem?: string | null;
          zm_kqn?: string | null;
          zm_loz?: string | null;
          zm_lue?: string | null;
          zm_lun?: string | null;
          zm_ny?: string | null;
          zm_toi?: string | null;
        };
        Update: {
          archived?: boolean | null;
          context?: string | null;
          created_at?: string;
          id?: string;
          ke_sw?: string | null;
          mw_ny?: string | null;
          mw_tum?: string | null;
          text?: string;
          tj_tg?: string | null;
          tool?: string;
          updated_at?: string | null;
          zm_bem?: string | null;
          zm_kqn?: string | null;
          zm_loz?: string | null;
          zm_lue?: string | null;
          zm_lun?: string | null;
          zm_ny?: string | null;
          zm_toi?: string | null;
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
          user_id: string;
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
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      call_edge_function: {
        Args: { body: Json; name: string };
        Returns: number;
      };
      custom_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
      get_non_anonymous_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          email: string;
          email_confirmed_at: string;
          id: string;
          last_sign_in_at: string;
        }[];
      };
    };
    Enums: {
      app_role:
        | 'resources.viewer'
        | 'resources.author'
        | 'resources.admin'
        | 'deployments.admin'
        | 'translations.viewer'
        | 'viewer'
        | 'author'
        | 'admin'
        | 'deployments.viewer'
        | 'deployments.author'
        | 'translations.author'
        | 'translations.admin';
      country_code: 'global' | 'mw' | 'zm' | 'tj';
      forecast_type: 'daily' | 'seasonal' | 'downscaled' | 'weekly';
      locale_code:
        | 'global_en'
        | 'mw_ny'
        | 'mw_tum'
        | 'zm_ny'
        | 'tj_tg'
        | 'zm_bem'
        | 'zm_toi'
        | 'zm_loz'
        | 'zm_lun'
        | 'zm_kqn'
        | 'zm_lue';
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
          type: Database['storage']['Enums']['buckettype'];
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
          type?: Database['storage']['Enums']['buckettype'];
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
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          format: string;
          id: string;
          type: Database['storage']['Enums']['buckettype'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          format?: string;
          id: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          format?: string;
          id?: string;
          type?: Database['storage']['Enums']['buckettype'];
          updated_at?: string;
        };
        Relationships: [];
      };
      iceberg_namespaces: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'iceberg_namespaces_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets_analytics';
            referencedColumns: ['id'];
          },
        ];
      };
      iceberg_tables: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          location: string;
          name: string;
          namespace_id: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id?: string;
          location: string;
          name: string;
          namespace_id: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          location?: string;
          name?: string;
          namespace_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'iceberg_tables_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets_analytics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'iceberg_tables_namespace_id_fkey';
            columns: ['namespace_id'];
            isOneToOne: false;
            referencedRelation: 'iceberg_namespaces';
            referencedColumns: ['id'];
          },
        ];
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
          },
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
          },
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
          },
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
          },
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
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
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
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          start_after?: string;
        };
        Returns: {
          id: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_legacy_v1: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v1_optimised: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
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
        'resources.viewer',
        'resources.author',
        'resources.admin',
        'deployments.admin',
        'translations.viewer',
        'viewer',
        'author',
        'admin',
        'deployments.viewer',
        'deployments.author',
        'translations.author',
        'translations.admin',
      ],
      country_code: ['global', 'mw', 'zm', 'tj'],
      forecast_type: ['daily', 'seasonal', 'downscaled', 'weekly'],
      locale_code: [
        'global_en',
        'mw_ny',
        'mw_tum',
        'zm_ny',
        'tj_tg',
        'zm_bem',
        'zm_toi',
        'zm_loz',
        'zm_lun',
        'zm_kqn',
        'zm_lue',
      ],
      resource_link_type: ['app', 'social', 'web'],
    },
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS'],
    },
  },
} as const;
