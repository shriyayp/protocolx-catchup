/*
# Create saved_briefs table (single-tenant, no auth)

1. Purpose
   CatchUp is a privacy-first, on-device analysis app. Chat text is never
   uploaded — all parsing and scoring runs in the browser. This table stores
   only the brief summary (the plain-text export), not the raw chat. Users
   can save a brief to revisit it later without re-loading the chat.

2. New Tables
   - saved_briefs
     - id (uuid, primary key, auto-generated)
     - title (text, a short label the user gives the brief)
     - user_name (text, the name used for analysis)
     - brief_text (text, the full plain-text brief export)
     - stats_json (jsonb, the stats object)
     - created_at (timestamptz, defaults to now)

3. Security
   - Enable RLS on saved_briefs.
   - Single-tenant, no sign-in screen: policies allow anon + authenticated full CRUD.

4. Notes
   - No raw chat text is stored — only the generated brief.
*/

CREATE TABLE IF NOT EXISTS saved_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_name text NOT NULL,
  brief_text text NOT NULL,
  stats_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_briefs" ON saved_briefs;
CREATE POLICY "anon_select_briefs" ON saved_briefs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_briefs" ON saved_briefs;
CREATE POLICY "anon_insert_briefs" ON saved_briefs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_briefs" ON saved_briefs;
CREATE POLICY "anon_update_briefs" ON saved_briefs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_briefs" ON saved_briefs;
CREATE POLICY "anon_delete_briefs" ON saved_briefs FOR DELETE
  TO anon, authenticated USING (true);