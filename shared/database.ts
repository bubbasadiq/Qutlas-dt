export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
          entity_type: string;
          entity_id: string | null;
          entity_name: string | null;
          changes: Json;
          old_data: Json;
          new_data: Json;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
          entity_type: string;
          entity_id?: string | null;
          entity_name?: string | null;
          changes?: Json;
          old_data?: Json;
          new_data?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
          entity_type?: string;
          entity_id?: string | null;
          entity_name?: string | null;
          changes?: Json;
          old_data?: Json;
          new_data?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      catalog_finishes: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          compatible_materials: string[];
          price_multiplier: number;
          lead_time_days_added: number;
          properties: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          compatible_materials?: string[];
          price_multiplier?: number;
          lead_time_days_added?: number;
          properties?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          compatible_materials?: string[];
          price_multiplier?: number;
          lead_time_days_added?: number;
          properties?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      catalog_materials: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          price_multiplier: number;
          density: number;
          properties: Json;
          compatible_processes: string[];
          compatible_finishes: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          price_multiplier?: number;
          density?: number;
          properties?: Json;
          compatible_processes?: string[];
          compatible_finishes?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          price_multiplier?: number;
          density?: number;
          properties?: Json;
          compatible_processes?: string[];
          compatible_finishes?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      catalog_parts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          subcategory: string | null;
          material: string | null;
          process: string | null;
          base_price: number;
          lead_time: string | null;
          lead_time_days: number;
          manufacturability: number;
          thumbnail: string | null;
          cad_file_path: string | null;
          cad_data: Json;
          materials: Json;
          parameters: Json;
          specifications: Json;
          finishes: Json;
          tags: string[];
          is_active: boolean;
          is_featured: boolean;
          view_count: number;
          sort_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          subcategory?: string | null;
          material?: string | null;
          process?: string | null;
          base_price?: number;
          lead_time?: string | null;
          lead_time_days?: number;
          manufacturability?: number;
          thumbnail?: string | null;
          cad_file_path?: string | null;
          cad_data?: Json;
          materials?: Json;
          parameters?: Json;
          specifications?: Json;
          finishes?: Json;
          tags?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          view_count?: number;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          subcategory?: string | null;
          material?: string | null;
          process?: string | null;
          base_price?: number;
          lead_time?: string | null;
          lead_time_days?: number;
          manufacturability?: number;
          thumbnail?: string | null;
          cad_file_path?: string | null;
          cad_data?: Json;
          materials?: Json;
          parameters?: Json;
          specifications?: Json;
          finishes?: Json;
          tags?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          view_count?: number;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          current_message_leaf_id: string | null;
          is_pinned: boolean;
          tags: string[];
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          current_message_leaf_id?: string | null;
          is_pinned?: boolean;
          tags?: string[];
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          current_message_leaf_id?: string | null;
          is_pinned?: boolean;
          tags?: string[];
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      hubs: {
        Row: {
          id: string;
          name: string;
          location: Json;
          address: string | null;
          capabilities: string[];
          materials: string[];
          processes: string[];
          rating: number;
          rating_count: number;
          completed_jobs: number;
          avg_lead_time: number;
          current_load: number;
          base_price: number;
          minimum_order: number;
          certified: boolean;
          certification_ids: string[];
          contact_email: string | null;
          contact_phone: string | null;
          operating_hours: Json;
          is_active: boolean;
          is_featured: boolean;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          location?: Json;
          address?: string | null;
          capabilities?: string[];
          materials?: string[];
          processes?: string[];
          rating?: number;
          rating_count?: number;
          completed_jobs?: number;
          avg_lead_time?: number;
          current_load?: number;
          base_price?: number;
          minimum_order?: number;
          certified?: boolean;
          certification_ids?: string[];
          contact_email?: string | null;
          contact_phone?: string | null;
          operating_hours?: Json;
          is_active?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          location?: Json;
          address?: string | null;
          capabilities?: string[];
          materials?: string[];
          processes?: string[];
          rating?: number;
          rating_count?: number;
          completed_jobs?: number;
          avg_lead_time?: number;
          current_load?: number;
          base_price?: number;
          minimum_order?: number;
          certified?: boolean;
          certification_ids?: string[];
          contact_email?: string | null;
          contact_phone?: string | null;
          operating_hours?: Json;
          is_active?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          part_id: string | null;
          quote_id: string | null;
          hub_id: string | null;
          order_id: string | null;
          quantity: number;
          material: string | null;
          finish: string | null;
          parameters: Json;
          total_price: number;
          status: 'pending' | 'processing' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'cancelled' | 'on_hold';
          priority: number;
          timeline: Json;
          tracking_number: string | null;
          tracking_url: string | null;
          estimated_completion: string | null;
          actual_start_date: string | null;
          payment_date: string | null;
          completed_date: string | null;
          shipped_date: string | null;
          notes: string | null;
          internal_notes: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          part_id?: string | null;
          quote_id?: string | null;
          hub_id?: string | null;
          order_id?: string | null;
          quantity?: number;
          material?: string | null;
          finish?: string | null;
          parameters?: Json;
          total_price?: number;
          status?: 'pending' | 'processing' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'cancelled' | 'on_hold';
          priority?: number;
          timeline?: Json;
          tracking_number?: string | null;
          tracking_url?: string | null;
          estimated_completion?: string | null;
          actual_start_date?: string | null;
          payment_date?: string | null;
          completed_date?: string | null;
          shipped_date?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          part_id?: string | null;
          quote_id?: string | null;
          hub_id?: string | null;
          order_id?: string | null;
          quantity?: number;
          material?: string | null;
          finish?: string | null;
          parameters?: Json;
          total_price?: number;
          status?: 'pending' | 'processing' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'cancelled' | 'on_hold';
          priority?: number;
          timeline?: Json;
          tracking_number?: string | null;
          tracking_url?: string | null;
          estimated_completion?: string | null;
          actual_start_date?: string | null;
          payment_date?: string | null;
          completed_date?: string | null;
          shipped_date?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_part_id_fkey';
            columns: ['part_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_parts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: false;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_hub_id_fkey';
            columns: ['hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: Json;
          parent_message_id: string | null;
          token_count: number;
          model_used: string | null;
          metadata: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role?: 'user' | 'assistant' | 'system';
          content?: Json;
          parent_message_id?: string | null;
          token_count?: number;
          model_used?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: Json;
          parent_message_id?: string | null;
          token_count?: number;
          model_used?: string | null;
          metadata?: Json;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_parent_message_id_fkey';
            columns: ['parent_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total_amount: number;
          currency: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          shipping_address: Json;
          billing_address: Json;
          shipping_method: string | null;
          shipping_cost: number;
          tax_amount: number;
          discount_amount: number;
          notes: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total_amount?: number;
          currency?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          shipping_address?: Json;
          billing_address?: Json;
          shipping_method?: string | null;
          shipping_cost?: number;
          tax_amount?: number;
          discount_amount?: number;
          notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total_amount?: number;
          currency?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          shipping_address?: Json;
          billing_address?: Json;
          shipping_method?: string | null;
          shipping_cost?: number;
          tax_amount?: number;
          discount_amount?: number;
          notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          job_id: string | null;
          order_id: string | null;
          user_id: string;
          tx_ref: string;
          flutterwave_id: string | null;
          amount: number;
          currency: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
          payment_method: string | null;
          customer_email: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          transaction_id: string | null;
          transaction_data: Json;
          verification_data: Json;
          verified_at: string | null;
          refunded_at: string | null;
          refund_reason: string | null;
          failure_reason: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          order_id?: string | null;
          user_id: string;
          tx_ref: string;
          flutterwave_id?: string | null;
          amount?: number;
          currency?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
          payment_method?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          transaction_id?: string | null;
          transaction_data?: Json;
          verification_data?: Json;
          verified_at?: string | null;
          refunded_at?: string | null;
          refund_reason?: string | null;
          failure_reason?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          order_id?: string | null;
          user_id?: string;
          tx_ref?: string;
          flutterwave_id?: string | null;
          amount?: number;
          currency?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
          payment_method?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          transaction_id?: string | null;
          transaction_data?: Json;
          verification_data?: Json;
          verified_at?: string | null;
          refunded_at?: string | null;
          refund_reason?: string | null;
          failure_reason?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          company: string | null;
          phone: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'enterprise';
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trial';
          currency_preference: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          stripe_customer_id: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          company?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trial';
          currency_preference?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          stripe_customer_id?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          company?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trial';
          currency_preference?: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
          stripe_customer_id?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      project_shares: {
        Row: {
          id: string;
          project_id: string;
          shared_with: string;
          permission: 'view' | 'edit' | 'admin';
          can_edit: boolean;
          can_share: boolean;
          expires_at: string | null;
          shared_by: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          shared_with: string;
          permission?: 'view' | 'edit' | 'admin';
          can_edit?: boolean;
          can_share?: boolean;
          expires_at?: string | null;
          shared_by: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          shared_with?: string;
          permission?: 'view' | 'edit' | 'admin';
          can_edit?: boolean;
          can_share?: boolean;
          expires_at?: string | null;
          shared_by?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_shares_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_shares_shared_with_fkey';
            columns: ['shared_with'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_shares_shared_by_fkey';
            columns: ['shared_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          thumbnail: string | null;
          workspace_data: Json;
          status: 'active' | 'archived' | 'deleted';
          privacy: 'private' | 'shared' | 'public';
          is_template: boolean;
          tags: string[];
          version: number;
          parent_project_id: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
          last_accessed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          thumbnail?: string | null;
          workspace_data?: Json;
          status?: 'active' | 'archived' | 'deleted';
          privacy?: 'private' | 'shared' | 'public';
          is_template?: boolean;
          tags?: string[];
          version?: number;
          parent_project_id?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          thumbnail?: string | null;
          workspace_data?: Json;
          status?: 'active' | 'archived' | 'deleted';
          privacy?: 'private' | 'shared' | 'public';
          is_template?: boolean;
          tags?: string[];
          version?: number;
          parent_project_id?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_parent_project_id_fkey';
            columns: ['parent_project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          part_id: string | null;
          user_id: string;
          project_id: string | null;
          quantity: number;
          material: string | null;
          finish: string | null;
          parameters: Json;
          base_price: number;
          material_multiplier: number;
          finish_multiplier: number;
          volume_discount: number;
          hub_price: number;
          platform_fee: number;
          unit_price: number;
          subtotal: number;
          total_price: number;
          lead_time_days: number;
          manufacturability: number;
          status: 'pending' | 'approved' | 'expired' | 'converted';
          expires_at: string | null;
          hub_id: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          part_id?: string | null;
          user_id: string;
          project_id?: string | null;
          quantity?: number;
          material?: string | null;
          finish?: string | null;
          parameters?: Json;
          base_price?: number;
          material_multiplier?: number;
          finish_multiplier?: number;
          volume_discount?: number;
          hub_price?: number;
          platform_fee?: number;
          unit_price?: number;
          subtotal?: number;
          total_price?: number;
          lead_time_days?: number;
          manufacturability?: number;
          status?: 'pending' | 'approved' | 'expired' | 'converted';
          expires_at?: string | null;
          hub_id?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          part_id?: string | null;
          user_id?: string;
          project_id?: string | null;
          quantity?: number;
          material?: string | null;
          finish?: string | null;
          parameters?: Json;
          base_price?: number;
          material_multiplier?: number;
          finish_multiplier?: number;
          volume_discount?: number;
          hub_price?: number;
          platform_fee?: number;
          unit_price?: number;
          subtotal?: number;
          total_price?: number;
          lead_time_days?: number;
          manufacturability?: number;
          status?: 'pending' | 'approved' | 'expired' | 'converted';
          expires_at?: string | null;
          hub_id?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'quotes_part_id_fkey';
            columns: ['part_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_parts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_hub_id_fkey';
            columns: ['hub_id'];
            isOneToOne: false;
            referencedRelation: 'hubs';
            referencedColumns: ['id'];
          },
        ];
      };
      user_stats: {
        Row: {
          user_id: string;
          total_projects: number;
          total_conversations: number;
          total_messages: number;
          total_jobs: number;
          total_completed_jobs: number;
          total_quotes: number;
          total_orders: number;
          total_spent: number;
          total_spent_currencies: Json;
          average_job_value: number;
          favorite_material: string | null;
          favorite_finish: string | null;
          last_activity: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          total_projects?: number;
          total_conversations?: number;
          total_messages?: number;
          total_jobs?: number;
          total_completed_jobs?: number;
          total_quotes?: number;
          total_orders?: number;
          total_spent?: number;
          total_spent_currencies?: Json;
          average_job_value?: number;
          favorite_material?: string | null;
          favorite_finish?: string | null;
          last_activity?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          total_projects?: number;
          total_conversations?: number;
          total_messages?: number;
          total_jobs?: number;
          total_completed_jobs?: number;
          total_quotes?: number;
          total_orders?: number;
          total_spent?: number;
          total_spent_currencies?: Json;
          average_job_value?: number;
          favorite_material?: string | null;
          favorite_finish?: string | null;
          last_activity?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          name: string | null;
          description: string | null;
          data: Json;
          is_published: boolean;
          published_at: string | null;
          is_auto_save: boolean;
          version: number;
          parent_workspace_id: string | null;
          tags: string[];
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          name?: string | null;
          description?: string | null;
          data?: Json;
          is_published?: boolean;
          published_at?: string | null;
          is_auto_save?: boolean;
          version?: number;
          parent_workspace_id?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          name?: string | null;
          description?: string | null;
          data?: Json;
          is_published?: boolean;
          published_at?: string | null;
          is_auto_save?: boolean;
          version?: number;
          parent_workspace_id?: string | null;
          tags?: string[];
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workspaces_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspaces_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspaces_parent_workspace_id_fkey';
            columns: ['parent_workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      active_jobs: {
        Row: {
          id: string | null;
          user_id: string | null;
          status: string | null;
          quantity: number | null;
          material: string | null;
          total_price: number | null;
          created_at: string | null;
          estimated_completion: string | null;
          hub_name: string | null;
          hub_city: string | null;
          part_name: string | null;
          part_category: string | null;
        };
        Relationships: [];
      };
      hub_performance: {
        Row: {
          id: string | null;
          name: string | null;
          rating: number | null;
          completed_jobs: number | null;
          avg_lead_time: number | null;
          current_load: number | null;
          certified: boolean | null;
          active_jobs: number | null;
          avg_job_value: number | null;
          years_active: number | null;
        };
        Relationships: [];
      };
      popular_parts: {
        Row: {
          id: string | null;
          name: string | null;
          category: string | null;
          base_price: number | null;
          lead_time_days: number | null;
          manufacturability: number | null;
          view_count: number | null;
          order_count: number | null;
        };
        Relationships: [];
      };
      user_dashboard: {
        Row: {
          user_id: string | null;
          full_name: string | null;
          subscription_tier: string | null;
          total_projects: number | null;
          total_conversations: number | null;
          total_jobs: number | null;
          total_completed_jobs: number | null;
          total_spent: number | null;
          last_activity: string | null;
          member_since: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_quote_price: {
        Args: {
          p_base_price: number;
          p_quantity: number;
          p_material_multiplier?: number;
          p_finish_multiplier?: number;
          p_hub_base_price?: number;
        };
        Returns: Json;
      };
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_tx_ref: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      log_activity: {
        Args: {
          p_user_id: string;
          p_action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
          p_entity_type: string;
          p_entity_id?: string;
          p_entity_name?: string;
          p_changes?: Json;
          p_old_data?: Json;
          p_new_data?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      activity_action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'share';
      currency_code: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';
      job_status: 'pending' | 'processing' | 'in_production' | 'quality_check' | 'shipped' | 'completed' | 'cancelled' | 'on_hold';
      message_role: 'user' | 'assistant' | 'system';
      order_status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
      payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
      privacy_level: 'private' | 'shared' | 'public';
      project_status: 'active' | 'archived' | 'deleted';
      quote_status: 'pending' | 'approved' | 'expired' | 'converted';
      subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trial';
      subscription_tier: 'free' | 'pro' | 'enterprise';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
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
  CompositeType extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeType]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action: ['create', 'update', 'delete', 'view', 'export', 'share'],
      currency_code: ['NGN', 'USD', 'EUR', 'GBP', 'CAD'],
      job_status: ['pending', 'processing', 'in_production', 'quality_check', 'shipped', 'completed', 'cancelled', 'on_hold'],
      message_role: ['user', 'assistant', 'system'],
      order_status: ['draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      payment_status: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
      privacy_level: ['private', 'shared', 'public'],
      project_status: ['active', 'archived', 'deleted'],
      quote_status: ['pending', 'approved', 'expired', 'converted'],
      subscription_status: ['active', 'inactive', 'cancelled', 'past_due', 'trial'],
      subscription_tier: ['free', 'pro', 'enterprise'],
    },
  },
} as const;
