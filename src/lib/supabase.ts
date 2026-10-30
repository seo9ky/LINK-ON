import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export type PracticeInput = { id: number; input: string; created_at: string };

export async function listPracticeInputs(signal: AbortSignal): Promise<PracticeInput[]> {
  const { data, error } = await getSupabase().from('input_db')
    .select('id,input,created_at').order('id', { ascending: false }).limit(20)
    .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(15000)]));
  if (error) {
    if (error.code === '42501') throw new Error('로그인 상태를 확인하고 다시 시도해 주세요.');
    throw new Error('목록을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.');
  }
  return data ?? [];
}

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
  client = createClient(parsed.origin, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  return client;
}

export async function savePracticeInput(value: string): Promise<void> {
  const input = value.trim();
  if (!input || input.length > 1000) throw new Error('저장할 내용을 1~1,000자 이내로 입력해 주세요.');
  // A separate list request keeps a successful save distinct from a failed refresh.
  const { error } = await getSupabase().from('input_db').insert({ input }).abortSignal(AbortSignal.timeout(15000));
  if (!error) return;
  if (error.code === '42501') throw new Error('저장 권한이 없습니다. 다시 로그인한 뒤 시도해 주세요.');
  if (error.code === 'PGRST205' || error.code === '42P01') throw new Error('input_db 테이블이 없습니다. 먼저 SQL 설정을 실행해 주세요.');
  if (error.code === '23514') throw new Error('저장할 내용을 1~1,000자 이내로 입력해 주세요.');
  throw new Error('저장 결과를 확인하지 못했습니다. 인터넷 연결과 Supabase 설정을 확인해 주세요. 다시 저장하기 전 Table Editor에서 중복 여부를 확인해 주세요.');
}

export async function sendPracticeLink(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + '/' } });
  if (error) throw new Error(error.status === 429
    ? '인증 요청이 많아요. 잠시 기다린 뒤 다시 시도해 주세요.'
    : '인증 메일을 보내지 못했어요. 이메일 주소와 메일 발송 설정을 확인해 주세요.');
}

export async function signOutPractice(): Promise<void> {
  const { error } = await getSupabase().auth.signOut({ scope: 'local' });
  if (error) throw new Error('로그아웃하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
}
