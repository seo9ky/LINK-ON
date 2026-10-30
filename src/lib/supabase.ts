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

export async function savePracticeInput(value: string): Promise<void> {
  const input = value.trim();
  if (!input || input.length > 1000) throw new Error('저장할 내용을 1~1,000자 이내로 입력해 주세요.');
  // INSERT only: requesting returned rows would also require SELECT permission.
  const { error } = await getSupabase().from('input_db').insert({ input }).abortSignal(AbortSignal.timeout(15000));
  if (!error) return;
  if (error.code === '42501') throw new Error('저장 권한이 없습니다. input_db의 INSERT 권한과 RLS 정책을 확인해 주세요.');
  if (error.code === 'PGRST205' || error.code === '42P01') throw new Error('input_db 테이블이 없습니다. 먼저 SQL 설정을 실행해 주세요.');
  if (error.code === '23514') throw new Error('저장할 내용을 1~1,000자 이내로 입력해 주세요.');
  throw new Error('저장 결과를 확인하지 못했습니다. 인터넷 연결과 Supabase 설정을 확인해 주세요. 다시 저장하기 전 Table Editor에서 중복 여부를 확인해 주세요.');
}
