import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (key && !key.startsWith('sb_publishable_')) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY must use a publishable key. Secret/service_role keys must never enter the browser build.');
  }
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('VITE_') || typeof value !== 'string') continue;
    const candidate = value.trim();
    if (candidate.startsWith('sb_secret_')) throw new Error(`Remove the secret key from ${name} before starting Vite.`);
    const parts = candidate.split('.');
    if (parts.length === 3) {
      let role: unknown;
      try { role = JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role; } catch { /* Not a JWT. */ }
      if (role === 'service_role') throw new Error(`Remove the service_role key from ${name} before starting Vite.`);
    }
  }
  return {};
});
