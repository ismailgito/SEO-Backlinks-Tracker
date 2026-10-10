const fs = require('fs');
const path = require('path');

const backlinks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/backlinks.json'), 'utf-8'));

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeArray(arr) {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const items = arr.map(a => `"${a.replace(/"/g, '\\"')}"`).join(',');
  return `'${items}'::text[]`;
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

sql += rows.join(',\n') + '\non conflict (id) do nothing;\n';

fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql, 'utf-8');
console.log(`Generated supabase/seed.sql with ${backlinks.length} rows.`);
