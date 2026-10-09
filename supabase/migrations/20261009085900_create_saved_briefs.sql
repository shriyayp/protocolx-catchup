/*
# Create saved_briefs table (single-tenant, no auth)

1. Purpose
   CatchUp is a privacy-first, on-device analysis app. Chat text is never
   uploaded — all parsing and scoring runs in the browser. This table stores
   only the *brief summary* (the plain-text export), not the raw chat. Users
   can save a brief to revisit it later without re-loading the chat.

2. New Tables
   - `saved_briefs`
     - `id` (uuid, primary key, auto-generated)
     - `title` (text, a short label the user gives the brief, e.g. "ProtocolX Team — Oct 9")
     - `user_name` (text, the name the user entered for analysis)
     - `brief_text` (text, the full plain-text brief export)
     - `stats_json` (jsonb, the stats object: unread, matter, mentions, deadlines, decisions, missed)
     - `created_at` (timestamptz, defaults to now)

3. Security
   - Enable RLS on `saved_briefs`.
   - This is a single-tenant app with no sign-in screen, so policies allow
     both `anon` and `authenticated` roles full CRUD. The data is intentionally
     shared/public — there is no per-user isolation.

4. Notes
   - No raw chat text is stored in this table — only the generated brief.
   - The `stats_json` column lets the UI render summary cards without re-parsing.
*/