import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1).trim()];
}));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert(key?.startsWith('sb_publishable_'), 'A publishable key is required');
assert(new URL(url).protocol === 'https:');
const headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
const cases = [
  { name: 'Anonymous SELECT denied', method: 'GET', query: '?select=id,input,created_at&limit=1', expected: [401, 403] },
  { name: 'Anonymous INSERT denied', method: 'POST', query: '', body: { input: 'anonymous-must-not-save' }, expected: [401, 403] },
  { name: 'Anonymous UPDATE denied', method: 'PATCH', query: '?id=eq.-1', body: { input: 'permission-test' }, expected: [401, 403] },
  { name: 'Anonymous DELETE denied', method: 'DELETE', query: '?id=eq.-1', expected: [401, 403] },
  { name: 'Blank INSERT rejected', method: 'POST', query: '', body: { input: '   ' }, expected: [400, 401, 403] },
  { name: 'Long INSERT rejected', method: 'POST', query: '', body: { input: 'x'.repeat(1001) }, expected: [400, 401, 403] },
  { name: 'Created_at override denied', method: 'POST', query: '', body: { input: 'permission-test', created_at: '2000-01-01T00:00:00Z' }, expected: [401, 403] },
];
for (const c of cases) {
  const response = await fetch(`${url}/rest/v1/input_db${c.query}`, {
    method: c.method, headers, body: c.body ? JSON.stringify(c.body) : undefined, signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  assert(c.expected.includes(response.status), `${c.name}: unexpected HTTP ${response.status}`);
  assert(['42501', '23514'].includes(data.code), `${c.name}: unexpected error code ${data.code}`);
  console.log(`PASS ${c.name}: HTTP ${response.status}, ${data.code}`);
}
