/**
 * Supabase database types for the baby tracking app.
 * Keep in sync with the SQL schema in supabase/schema.sql
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          line_user_id: string | null;
          phone: string | null;
          display_name: string | null;
          picture_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          line_user_id?: string | null;
          phone?: string | null;
          display_name?: string | null;
          picture_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          line_user_id?: string | null;
          phone?: string | null;
          display_name?: string | null;
          picture_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      babies: {
        Row: {
          id: string;
          name: string;
          birth_date: string | null;
          gender: string | null;
          avatar_url: string | null;
          created_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          birth_date?: string | null;
          gender?: string | null;
          avatar_url?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string | null;
          gender?: string | null;
          avatar_url?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      baby_members: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      milk_logs: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          type: string;
          amount_ml: number | null;
          duration_minutes: number | null;
          logged_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          type: string;
          amount_ml?: number | null;
          duration_minutes?: number | null;
          logged_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          type?: string;
          amount_ml?: number | null;
          duration_minutes?: number | null;
          logged_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      excretion_event: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string | null;
          type: string;
          datetime: string;
          diaper_used: boolean;
          pee_amount: string | null;
          pee_color: string | null;
          poop_color: string | null;
          poop_texture: string | null;
          poop_amount: string | null;
          smell: string | null;
          rash: boolean | null;
          leak: boolean | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id?: string | null;
          type: string;
          datetime?: string;
          diaper_used?: boolean;
          pee_amount?: string | null;
          pee_color?: string | null;
          poop_color?: string | null;
          poop_texture?: string | null;
          poop_amount?: string | null;
          smell?: string | null;
          rash?: boolean | null;
          leak?: boolean | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string | null;
          type?: string;
          datetime?: string;
          diaper_used?: boolean;
          pee_amount?: string | null;
          pee_color?: string | null;
          poop_color?: string | null;
          poop_texture?: string | null;
          poop_amount?: string | null;
          smell?: string | null;
          rash?: boolean | null;
          leak?: boolean | null;
          note?: string | null;
          created_at?: string;
        };
      };
      growth_records: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          recorded_at: string;
          weight_kg: number | null;
          height_cm: number | null;
          head_circumference_cm: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          recorded_at?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          recorded_at?: string;
          weight_kg?: number | null;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_logs: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration_minutes: number | null;
          type: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          started_at: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          type?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          type?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          title: string;
          doctor_name: string | null;
          hospital: string | null;
          appointment_at: string;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          title: string;
          doctor_name?: string | null;
          hospital?: string | null;
          appointment_at: string;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string;
          title?: string;
          doctor_name?: string | null;
          hospital?: string | null;
          appointment_at?: string;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      baby_invites: {
        Row: {
          id: string;
          baby_id: string;
          inviter_user_id: string;
          invitee_line_user_id: string | null;
          invitee_email: string | null;
          label: string | null;
          token: string;
          role: string;
          status: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          inviter_user_id: string;
          invitee_line_user_id?: string | null;
          invitee_email?: string | null;
          label?: string | null;
          token: string;
          role?: string;
          status?: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          inviter_user_id?: string;
          invitee_line_user_id?: string | null;
          invitee_email?: string | null;
          label?: string | null;
          token?: string;
          role?: string;
          status?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Convenience type for a single baby row */
export type Baby = Database["public"]["Tables"]["babies"]["Row"];

export type UserRow = {
  id: string;
  line_user_id: string | null;
  phone: string | null;
  display_name: string | null;
  picture_url: string | null;
};

export type MemberRow = {
  baby_id: string;
  role: string;
};

export type BabyRow = {
  id: string;
  name: string;
  birth_date: string | null;
  gender: string | null;
  avatar_url: string | null;
};
