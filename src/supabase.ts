import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DatabasePortfolioItem {
  id: number
  created_at: string
  symbol: string
  shares: number
  price: number
  dividend_per_share: number
  next_dividend_date: string
  dividend_frequency: string
  user_id: string
} 