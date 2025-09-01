import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymmjqwlkwzgzsfshgewi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbWpxd2xrd3pnenNmc2hnZXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODA0MzksImV4cCI6MjA2ODY1NjQzOX0.VPmSTIPiRL3sOL2fiMztkF5j23Z0RIuoYa-IsYSrNkk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id?: string
  username: string
  password: string
  user_type: 'admin' | 'user'
  search_limit?: number
  remaining_searches?: number
  phone_number?: string
  company_name?: string
  created_at?: string
}

export interface BlockedUser {
  id?: string
  user_id: string
  name: string
  reason: string
  created_at?: string
  created_by?: string
}