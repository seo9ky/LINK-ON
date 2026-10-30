import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Supabase 연결 설정이 없습니다. .env.local을 설정하고 개발 서버를 다시 시작해 주세요.');
  if (!key.startsWith('sb_publishable_')) throw new Error('프런트엔드에는 sb_publishable_로 시작하는 공개용 키만 사용할 수 있습니다.');
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('Supabase 프로젝트 URL을 확인해 주세요.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
    throw new Error('Supabase URL은 https://프로젝트주소 형태로 입력해 주세요. 하위 경로는 넣지 않습니다.');
  }
  client = createClient(parsed.origin, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}

export async function submitInquiry(id: string, value: string, replyTo: string): Promise<void> {
  const message = value.trim();
  const email = replyTo.trim() || null;
  if (!message || message.length > 2000 || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) throw new Error('Invalid inquiry');
  const { error } = await getSupabase().from('inquiries').insert({ id, message, email }).abortSignal(AbortSignal.timeout(15000));
  // Retries reuse an unguessable request ID; a duplicate means this request was received.
  if (error && error.code !== '23505') throw error;
}
