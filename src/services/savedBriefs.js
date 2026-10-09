/**
 * savedBriefs.js — Save and retrieve brief summaries from the database.
 * Only the brief text and stats are stored — never raw chat content.
 */
import { supabase } from './supabaseClient.js'

/**
 * Save a brief to the database.
 * @param {string} title - Short label for the brief
 * @param {string} userName - The name used for analysis
 * @param {string} briefText - The full plain-text brief export
 * @param {object} stats - The stats object from analysis
 * @returns {Promise<{ data, error }>}
 */
export async function saveBrief(title, userName, briefText, stats) {
  return supabase
    .from('saved_briefs')
    .insert({
      title,
      user_name: userName,
      brief_text: briefText,
      stats_json: stats,
    })
    .select()
    .single()
}

/**
 * Fetch all saved briefs, newest first.
 * @returns {Promise<{ data, error }>}
 */
export async function fetchBriefs() {
  return supabase
    .from('saved_briefs')
    .select('id, title, user_name, brief_text, stats_json, created_at')
    .order('created_at', { ascending: false })
}

/**
 * Delete a saved brief by ID.
 * @param {string} id
 * @returns {Promise<{ error }>}
 */
export async function deleteBrief(id) {
  return supabase.from('saved_briefs').delete().eq('id', id)
}
