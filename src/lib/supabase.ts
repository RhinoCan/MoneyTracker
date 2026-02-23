// @/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      system_settings: {
        Row: {
          id: string;
          user_id: string;
          locale_value: string;
          currency_value: string;
          timeout_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          locale_value: string;
          currency_value: string;
          timeout_value: number;
          created_at?: string;
        };
        Update: {
          locale_value?: string;
          currency_value?: string;
          timeout_value?: number;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: number;
          user_id: string;
          date: string;
          description: string;
          transaction_type: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          date: string;
          description: string;
          transaction_type: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          date?: string;
          description?: string;
          transaction_type?: string;
          amount?: number;
          created_at?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
