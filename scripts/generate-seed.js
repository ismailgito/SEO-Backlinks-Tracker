const fs = require('fs');
const path = require('path');

const backlinks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/backlinks.json'), 'utf-8'));

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Postgres array literal: '{"a","b"}'. The braces are required (without them
// the whole INSERT fails with "malformed array literal"); inside the literal
// backslashes and double quotes are backslash-escaped, then the whole literal
// is escaped as a SQL string.
function escapeArray(arr) {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const items = arr
    .map(a => `"${String(a).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',');
  return `'${`{${items}}`.replace(/'/g, "''")}'::text[]`;
}

let sql = `-- Supabase Seed Data for Backlink Sources
-- Total Sources: ${backlinks.length}
-- Generated from data/backlinks.json

insert into public.backlink_sources (
  id,
  name,
  submission_url,
  domain,
  dr,
  dr_band,
  categories,
  source_follow_status,
  source_list_reference
) values
`;

const rows = backlinks.map(b => {
  return `(${escapeSql(b.id)}, ${escapeSql(b.name)}, ${escapeSql(b.submission_url)}, ${escapeSql(b.domain)}, ${b.dr}, ${escapeSql(b.dr_band)}, ${escapeArray(b.categories)}, ${escapeSql(b.source_follow_status)}, ${escapeSql(b.source_list_reference)})`;
});

// Upsert so edits to existing catalog rows (DR, URLs, categories) propagate when
// the seed is re-run; `do nothing` silently kept stale rows forever.
sql +=
  rows.join(',\n') +
  `
on conflict (id) do update set
  name = excluded.name,
  submission_url = excluded.submission_url,
  domain = excluded.domain,
  dr = excluded.dr,
  dr_band = excluded.dr_band,
  categories = excluded.categories,
  source_follow_status = excluded.source_follow_status,
  source_list_reference = excluded.source_list_reference,
  updated_at = now();
`;

fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql, 'utf-8');
console.log(`Generated supabase/seed.sql with ${backlinks.length} rows.`);
