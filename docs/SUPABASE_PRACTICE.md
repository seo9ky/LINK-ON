# Supabase 입력값 저장 실습

실습 위치는 **시연 설정 → 입력값 저장**입니다. `src/SupabasePractice.tsx`가 입력 문장을 받고 `src/lib/supabase.ts`에서 `input_db`에 `{ input: 내용 }`을 저장합니다. 기존 혜택·결제 체험은 브라우저의 시연 상태를 계속 사용합니다.

## 1. 데이터베이스

이번에 연결한 프로젝트는 `seo9ky's Project` (`prfkzeynkrreafoqablj`)입니다. `supabase/input_db.sql`은 SQL Editor용 최초 설정 스크립트이며 이미 이 프로젝트에 실행했습니다. 기존 테이블에 반복 실행하지 마세요. Supabase CLI의 마이그레이션 이력으로 등록한 파일은 아닙니다.

| 열 | 형식 | 생성 방식 |
| --- | --- | --- |
| id | bigint | 데이터베이스가 자동 생성 |
| input | text | 입력 문장, 공백만 입력 불가, 최대 1,000자 |
| created_at | timestamptz | 데이터베이스가 저장 시각 생성 |

RLS를 켜고 `anon`/`authenticated` 역할에 `input` 열 INSERT만 허용했습니다. 브라우저에서 SELECT·UPDATE·DELETE와 생성 시각 지정은 허용하지 않습니다. 따라서 저장 코드에 `.select()`를 붙이지 않습니다. 저장한 행은 관리자 대시보드의 Table Editor에서 확인합니다.

로그인 없는 수업용 입력 실습입니다. 이 정책은 누구나 문장을 추가할 수 있으므로 실제 고객 문의·개인정보 수집용 정책으로 사용하지 않습니다. 실제 서비스로 확장할 때는 인증·소유자 정책·요청 횟수 제한을 별도로 설계하세요.

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
2. 시연 설정 → 입력값 저장에서 `테스트 중입니다.` 같은 실습 문장을 입력합니다.
3. **Supabase에 저장하기**를 누릅니다. 요청 중에는 중복 제출과 입력 변경을 막습니다.
4. 성공 안내를 확인합니다. 실패하면 작성한 내용이 유지됩니다.
5. Supabase → Table Editor → `input_db`에서 입력 문장과 저장 시각을 확인합니다.

통신 중단이나 시간 초과는 서버 저장 여부가 불명확할 수 있으므로 다시 누르기 전에 Table Editor에서 중복 여부를 확인합니다.

## 4. 검사

```sh
npm run build
npm run test:unit
node --test tests/supabase-config.test.mjs
npm test -- tests/supabase-practice.spec.ts
node tests/check-supabase-access.mjs
```

폼 자동 검사는 통신을 가짜 응답으로 대체하여 성공·RLS 오류·재시도·모바일 폭을 확인합니다. 권한 검사는 실제 프로젝트에서 읽기·수정·삭제 차단, 공백·길이 제한, 생성 시각 변경 차단을 확인합니다. 실제 정상 저장은 브라우저에서 제출하고 관리자 Table Editor에서 행을 확인해야 합니다.

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
