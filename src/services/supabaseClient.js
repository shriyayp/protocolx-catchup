/**
 * supabaseClient.js — Singleton Supabase client for saving briefs.
 * Note: only the brief summary is saved, never the raw chat text.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey)
