// Tipos generados desde Supabase (mcp generate_typescript_types). No editar a mano.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      cashier_accounts: {
        Row: { cash_on_hand: number; cashier_id: string; created_at: string; float_balance: number; updated_at: string }
        Insert: { cash_on_hand?: number; cashier_id: string; created_at?: string; float_balance?: number; updated_at?: string }
        Update: { cash_on_hand?: number; cashier_id?: string; created_at?: string; float_balance?: number; updated_at?: string }
        Relationships: [
          { foreignKeyName: "cashier_accounts_cashier_id_fkey"; columns: ["cashier_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: { body: string | null; created_at: string; id: number; read: boolean; title: string; type: string; user_id: string }
        Insert: { body?: string | null; created_at?: string; id?: never; read?: boolean; title: string; type: string; user_id: string }
        Update: { body?: string | null; created_at?: string; id?: never; read?: boolean; title?: string; type?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: {
          alias: string
          balance: number
          birth_date: string | null
          cashier_id: string | null
          created_at: string
          cuit: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          alias: string
          balance?: number
          birth_date?: string | null
          cashier_id?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          alias?: string
          balance?: number
          birth_date?: string | null
          cashier_id?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "profiles_cashier_id_fkey"; columns: ["cashier_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      rooms: {
        Row: { code: string; created_at: string; game_type: string; host_id: string; name: string; status: string }
        Insert: { code: string; created_at?: string; game_type: string; host_id: string; name: string; status?: string }
        Update: { code?: string; created_at?: string; game_type?: string; host_id?: string; name?: string; status?: string }
        Relationships: [
          { foreignKeyName: "rooms_host_id_fkey1"; columns: ["host_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      transactions: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string
          created_by: string
          float_balance_after: number | null
          game_type: string | null
          id: number
          meta: Json
          player_balance_after: number | null
          player_id: string | null
          room_code: string | null
          round_id: string | null
          type: Database["public"]["Enums"]["txn_type"]
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string
          created_by: string
          float_balance_after?: number | null
          game_type?: string | null
          id?: never
          meta?: Json
          player_balance_after?: number | null
          player_id?: string | null
          room_code?: string | null
          round_id?: string | null
          type: Database["public"]["Enums"]["txn_type"]
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string
          created_by?: string
          float_balance_after?: number | null
          game_type?: string | null
          id?: never
          meta?: Json
          player_balance_after?: number | null
          player_id?: string | null
          room_code?: string | null
          round_id?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
        }
        Relationships: [
          { foreignKeyName: "transactions_cashier_id_fkey"; columns: ["cashier_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      v_cashier_reconciliation: {
        Row: {
          cash_on_hand: number | null
          cash_variance: number | null
          cashier_alias: string | null
          cashier_id: string | null
          expected_cash: number | null
          expected_float: number | null
          float_assigned_total: number | null
          float_balance: number | null
          float_variance: number | null
          total_loaded: number | null
          total_withdrawn: number | null
        }
        Relationships: []
      }
      v_chips_in_circulation: { Row: { chips_in_circulation: number | null }; Relationships: [] }
      v_house_position: {
        Row: {
          game_hold: number | null
          net_cash_position: number | null
          outstanding_chip_liability: number | null
          total_bets: number | null
          total_loaded: number | null
          total_wins: number | null
          total_withdrawn: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_player: { Args: { p_player: string }; Returns: undefined }
      admin_adjust_balance: { Args: { p_delta: number; p_player: string; p_reason: string }; Returns: number }
      admin_assign_float: { Args: { p_amount: number; p_cashier: string }; Returns: number }
      admin_close_caja: { Args: { p_cashier: string }; Returns: Json }
      admin_set_role: { Args: { p_role: Database["public"]["Enums"]["user_role"]; p_user: string }; Returns: undefined }
      admin_set_status: { Args: { p_status: Database["public"]["Enums"]["user_status"]; p_user: string }; Returns: undefined }
      auth_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["user_role"] }
      cashier_load_chips: { Args: { p_amount: number; p_player: string }; Returns: number }
      cashier_withdraw_chips: { Args: { p_amount: number; p_player: string }; Returns: number }
      place_bet: { Args: { p_amount: number; p_game_type: string; p_room_code: string; p_round: string }; Returns: number }
      settle_game_round: { Args: { p_game_type: string; p_payouts: Json; p_room_code: string; p_round: string }; Returns: undefined }
    }
    Enums: {
      txn_type: "cashier_load" | "cashier_withdraw" | "bet" | "win" | "float_assign" | "adjustment" | "settlement"
      user_role: "player" | "cashier" | "admin"
      user_status: "pending" | "active" | "blocked"
    }
    CompositeTypes: Record<PropertyKey, never>
  }
}

type PublicSchema = Database["public"]

export type Profile = PublicSchema["Tables"]["profiles"]["Row"]
export type CashierAccount = PublicSchema["Tables"]["cashier_accounts"]["Row"]
export type Transaction = PublicSchema["Tables"]["transactions"]["Row"]
export type Notification = PublicSchema["Tables"]["notifications"]["Row"]
export type Room = PublicSchema["Tables"]["rooms"]["Row"]
export type CashierReconciliation = PublicSchema["Views"]["v_cashier_reconciliation"]["Row"]
export type HousePosition = PublicSchema["Views"]["v_house_position"]["Row"]

export type UserRole = PublicSchema["Enums"]["user_role"]
export type UserStatus = PublicSchema["Enums"]["user_status"]
export type TxnType = PublicSchema["Enums"]["txn_type"]
