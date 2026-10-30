# Supabase 입력값 저장 실습

실습 위치는 **시연 설정 → 입력값 저장**입니다. `src/SupabasePractice.tsx`가 입력 문장을 받고 `src/lib/supabase.ts`에서 `input_db`에 `{ input: 내용 }`을 저장합니다. 기존 혜택·결제 체험은 브라우저의 시연 상태를 계속 사용합니다.

## 1. 데이터베이스

이번에 연결한 프로젝트는 `seo9ky's Project` (`prfkzeynkrreafoqablj`)입니다. `supabase/input_db.sql`은 SQL Editor용 최초 설정 스크립트이며 이미 이 프로젝트에 실행했습니다. 기존 테이블에 반복 실행하지 마세요. Supabase CLI의 마이그레이션 이력으로 등록한 파일은 아닙니다.

| 열 | 형식 | 생성 방식 |
| --- | --- | --- |
| id | bigint | 데이터베이스가 자동 생성 |
| input | text | 입력 문장, 공백만 입력 불가, 최대 1,000자 |
| created_at | timestamptz | 데이터베이스가 저장 시각 생성 |

최초 설정 뒤 `supabase/input_db_private.sql`을 실행하면 로그인한 본인의 개인 실습 목록을 사용할 수 있습니다. 이 파일도 SQL Editor용이며 기존 행은 유지합니다. `user_id`는 서버가 `auth.uid()`로 설정하며 브라우저가 다른 작성자를 지정할 수 없습니다. RLS는 `authenticated` 역할에 본인의 `input` INSERT와 `id`·`input`·`created_at` SELECT만 허용합니다. 비로그인 접근과 UPDATE·DELETE·생성 시각 지정은 차단합니다. 저장과 조회 요청을 분리해 목록 갱신이 실패해도 저장 실패로 오인하지 않도록 합니다.

사용자의 최신 결정은 **로그인한 본인의 문장만 표시**입니다. 공개 조회 정책은 적용하지 않았습니다. 과거 로그인 없이 저장한 검증 문장 4개는 작성자를 확인할 수 없어 `user_id`를 비워 두며 관리자만 확인할 수 있습니다. 어떤 계정에도 임의 배정하지 않습니다. 화면은 본인의 최근 20개를 표시하며 데이터 접근은 서버 RLS로 제한합니다. 실서비스 고객 데이터 수집에는 별도 운영 정책과 요청 횟수 제한 등이 필요합니다.

이메일 링크로 로그인합니다. Supabase의 Email provider를 사용하며 기본 Magic Link 메일 템플릿을 유지합니다. URL Configuration의 Site URL은 `https://link-on.kro.kr/`, 허용 복귀 주소는 운영 주소, `https://link-on-git-minseok-seo9ky.vercel.app/`, `http://127.0.0.1:5173/`입니다. PKCE를 사용하므로 로그인 메일은 요청한 기기의 같은 브라우저에서 열어야 합니다. 임의의 Preview 배포 URL 대신 위 고정 Preview 주소를 사용하세요. 기본 메일 발송기는 팀 멤버 주소와 발송량 제한이 있으므로 일반 사용자에게 제공하려면 별도 SMTP 설정이 필요할 수 있습니다. `.env.local`에는 여전히 공개용 키만 사용합니다.

## 2. 패키지와 환경변수

`@supabase/supabase-js`는 정확한 버전과 잠금 파일로 관리합니다. 새 환경에서는 `npm ci`를 실행합니다.

`.env.example`을 `.env.local`로 복사하고 아래 값을 Supabase 대시보드에서 입력합니다. 이 PC에는 공개용 키로 이미 연결했습니다.

```dotenv
VITE_SUPABASE_URL=https://프로젝트주소.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_공개용키
```

URL은 Data API 주소에서 `/rest/v1/`을 제외한 부분입니다. 키는 Settings → API Keys → Publishable key를 사용합니다. `.env.local`은 Git에서 제외됩니다. `VITE_` 값은 브라우저 빌드에 포함되므로 비밀 저장소가 아닙니다. `secret`/`service_role` 키는 넣지 마세요. `vite.config.ts`가 해당 키를 감지하면 실행·빌드를 중단합니다.

환경변수를 수정한 후 개발 서버를 다시 시작합니다. `npm` 명령을 찾지 못하면 이 PC의 `scripts\package.cmd run dev`를 사용합니다.

## 3. 직접 확인

1. `npm run dev` 실행 후 로컬 화면을 엽니다.
2. 시연 설정 → 입력값 저장에서 이메일 로그인 링크를 받고 같은 브라우저로 엽니다. 로그인 후 `테스트 중입니다.` 같은 실습 문장을 입력합니다.
3. **Supabase에 저장하기**를 누릅니다. 요청 중에는 중복 제출과 입력 변경을 막습니다.
4. 성공 안내를 확인합니다. 실패하면 작성한 내용이 유지됩니다.
5. 폼 아래 **내가 저장한 문장**에서 방금 입력한 문장과 저장 시각을 확인합니다. 본인의 문장 중 최신 ID 순으로 최근 20개가 표시됩니다.
6. **새로고침**으로 다른 화면에서 저장한 문장도 불러옵니다. 조회 오류 때 기존 목록을 보존하고 재시도할 수 있습니다. 페이지를 다시 열거나 입력값 저장 탭으로 돌아와도 조회합니다.
7. 관리자 확인은 Supabase → Table Editor → `input_db`에서도 가능합니다.

저장 통신 중단이나 시간 초과는 서버 저장 여부가 불명확할 수 있으므로 다시 저장하기 전에 목록 새로고침 또는 Table Editor에서 중복 여부를 확인합니다. 저장 성공 후 목록 조회만 실패한 경우에는 저장을 반복하지 말고 목록만 새로고침합니다.

## 4. 검사

```sh
npm run build
npm run test:unit
node --test tests/supabase-config.test.mjs
npm test -- tests/supabase-practice.spec.ts
node tests/check-supabase-access.mjs
```

폼 자동 검사는 모의 로그인·응답으로 저장·목록 갱신·조회 오류 재시도·빈 목록·오래된 응답 차단·페이지 새로고침·모바일 긴 문장·로그아웃 후 개인 내용 제거를 확인합니다. `practice-login.spec.ts`는 비로그인 조회 금지, 메일 발송 실패, PKCE 복귀를 확인합니다. `check-supabase-access.mjs`는 실제 프로젝트의 비로그인 읽기·쓰기·수정·삭제 차단을 확인합니다. 실제 정상 저장은 이메일 로그인 후 브라우저에서 제출하고 개인 목록에서 확인합니다. SQL 역할 분리 검사는 `supabase/verify_input_db_private.sql`로 실행하며 임시 검증 계정과 문장은 같은 트랜잭션에서 되돌립니다.

## 연결 도구

ChatGPT 설정에서 Supabase 플러그인과 계정의 OAuth 연결을 확인했습니다. 이 대화에서는 도구 목록에 Supabase MCP가 나타나지 않아 SQL Editor로 설정했습니다. 이후 Supabase 플러그인을 선택한 대화에서 `input_db 테이블과 RLS 정책을 확인해 줘`라고 요청해 도구 인식을 확인할 수 있습니다.

## 공식 참고

- [Supabase 공개용 키](https://supabase.com/docs/guides/getting-started/api-keys)
- [RLS와 권한](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [JavaScript insert](https://supabase.com/docs/reference/javascript/insert)
- [Vite 환경변수](https://vite.dev/guide/env-and-mode)
- [Supabase MCP 연결](https://supabase.com/docs/guides/ai-tools/mcp)


## Vercel 배포 설정

Vercel의 link-on → Settings → Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 Preview와 Production에 설정합니다. 2026-10-30에 로컬 검증에 사용한 공개용 값으로 설정했습니다. 별도 API_KEY 변수는 필요하지 않습니다. .env.local은 업로드하지 않습니다.

환경변수를 바꾸면 새 배포가 필요합니다. VITE_ 값은 브라우저에 포함되므로 Secret으로 표시해도 브라우저에서 숨겨지지 않습니다. publishable key는 공개용이며 secret/service_role 키는 사용하지 않습니다.
