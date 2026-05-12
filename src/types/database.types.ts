export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      sf_sales_daily_actuals: {
        Row: {
          business_date: string
          created_at: string | null
          id: string
          imported_from: string | null
          is_new_order: boolean | null
          order_count: number | null
          sales_amount: number | null
          sales_count: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          business_date: string
          created_at?: string | null
          id?: string
          imported_from?: string | null
          is_new_order?: boolean | null
          order_count?: number | null
          sales_amount?: number | null
          sales_count?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          business_date?: string
          created_at?: string | null
          id?: string
          imported_from?: string | null
          is_new_order?: boolean | null
          order_count?: number | null
          sales_amount?: number | null
          sales_count?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "sf_sales_daily_actuals_imported_from_fkey"; columns: ["imported_from"]; isOneToOne: false; referencedRelation: "sf_sales_import_jobs"; referencedColumns: ["id"] },
          { foreignKeyName: "sf_sales_daily_actuals_store_id_fkey"; columns: ["store_id"]; isOneToOne: false; referencedRelation: "sf_sales_stores"; referencedColumns: ["id"] },
        ]
      }
      sf_sales_import_jobs: {
        Row: {
          business_date: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          id: string
          rows_imported: number | null
          started_at: string | null
          status: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          business_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          rows_imported?: number | null
          started_at?: string | null
          status?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          business_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          rows_imported?: number | null
          started_at?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      sf_sales_monthly_targets: {
        Row: {
          created_at: string | null
          id: string
          office_id: string
          order_count_target: number | null
          partner_id: string
          sales_amount_target: number | null
          sales_rep_id: string
          updated_at: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          office_id: string
          order_count_target?: number | null
          partner_id: string
          sales_amount_target?: number | null
          sales_rep_id: string
          updated_at?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          id?: string
          office_id?: string
          order_count_target?: number | null
          partner_id?: string
          sales_amount_target?: number | null
          sales_rep_id?: string
          updated_at?: string | null
          year_month?: string
        }
        Relationships: []
      }
      sf_sales_offices: {
        Row: { created_at: string | null; display_order: number | null; id: string; is_active: boolean | null; name: string; updated_at: string | null }
        Insert: { created_at?: string | null; display_order?: number | null; id?: string; is_active?: boolean | null; name: string; updated_at?: string | null }
        Update: { created_at?: string | null; display_order?: number | null; id?: string; is_active?: boolean | null; name?: string; updated_at?: string | null }
        Relationships: []
      }
      sf_sales_partners: {
        Row: { category: string | null; created_at: string | null; display_order: number | null; id: string; is_active: boolean | null; name: string; updated_at: string | null }
        Insert: { category?: string | null; created_at?: string | null; display_order?: number | null; id?: string; is_active?: boolean | null; name: string; updated_at?: string | null }
        Update: { category?: string | null; created_at?: string | null; display_order?: number | null; id?: string; is_active?: boolean | null; name?: string; updated_at?: string | null }
        Relationships: []
      }
      sf_sales_reps: {
        Row: { created_at: string | null; id: string; is_active: boolean | null; name: string; office_id: string; updated_at: string | null }
        Insert: { created_at?: string | null; id?: string; is_active?: boolean | null; name: string; office_id: string; updated_at?: string | null }
        Update: { created_at?: string | null; id?: string; is_active?: boolean | null; name?: string; office_id?: string; updated_at?: string | null }
        Relationships: []
      }
      sf_sales_stores: {
        Row: { created_at: string | null; id: string; is_active: boolean | null; is_new_this_period: boolean | null; name: string; notes: string | null; office_id: string; partner_id: string; sales_rep_id: string | null; updated_at: string | null }
        Insert: { created_at?: string | null; id?: string; is_active?: boolean | null; is_new_this_period?: boolean | null; name: string; notes?: string | null; office_id: string; partner_id: string; sales_rep_id?: string | null; updated_at?: string | null }
        Update: { created_at?: string | null; id?: string; is_active?: boolean | null; is_new_this_period?: boolean | null; name?: string; notes?: string | null; office_id?: string; partner_id?: string; sales_rep_id?: string | null; updated_at?: string | null }
        Relationships: []
      }
    }
    Views: {
      sf_sales_v_office_daily_summary: {
        Row: { business_date: string | null; office_id: string | null; order_count_actual: number | null; sales_amount_actual: number | null; sales_count_actual: number | null; store_count: number | null }
        Relationships: []
      }
      sf_sales_v_partner_daily_summary: {
        Row: { business_date: string | null; office_id: string | null; order_count_actual: number | null; partner_id: string | null; sales_amount_actual: number | null; sales_count_actual: number | null; store_count: number | null }
        Relationships: []
      }
      sf_sales_v_rep_daily_summary: {
        Row: { business_date: string | null; office_id: string | null; order_count_actual: number | null; sales_amount_actual: number | null; sales_count_actual: number | null; sales_rep_id: string | null; store_count: number | null }
        Relationships: []
      }
    }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
