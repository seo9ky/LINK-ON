# 실행과 업데이트

작업 폴더는 `C:\Users\KDA\LINK-ON`, 작업 브랜치는 `minseok`입니다. `main`은 검증한 변경을 배포하는 브랜치로 사용합니다.

## VS Code에서 실행

1. **파일 → 폴더 열기**에서 프로젝트 폴더를 엽니다.
2. **터미널 → 새 터미널**을 엽니다.
3. 처음 설치할 때는 `npm ci`, 실행할 때는 `npm run dev`를 입력합니다.
4. [로컬 화면](http://127.0.0.1:5173/)에서 확인합니다. 종료는 **Ctrl+C**입니다.

Node.js 24 계열을 사용합니다. 새 PC에서는 [Node.js](https://nodejs.org/)와 [VS Code](https://code.visualstudio.com/)를 설치하고 저장소를 내려받으세요.

```sh
git clone https://github.com/seo9ky/LINK-ON.git
cd LINK-ON
git switch minseok
npm ci
npm run dev
```

Windows에서는 `start.cmd`로도 실행할 수 있습니다. VS Code의 **터미널 → 작업 실행**에 패키지 설치·실행·빌드 검사가 등록되어 있습니다. F5는 이미 실행 중인 화면을 Edge에서 엽니다.

`npm`을 찾지 못하면 터미널을 다시 열어 보세요. 이 PC에 준비된 보조 도구는 `.\scripts\package.cmd run dev`로 실행합니다. `Port 5173 is already in use`는 서버가 이미 켜져 있다는 뜻입니다. 기존 로컬 화면을 사용하거나, 서버를 실행한 터미널에서 종료한 뒤 다시 시작하세요.

## 수정 전 최신 내용 받기

```sh
git status
git fetch origin
git switch minseok
git pull --ff-only origin minseok
git merge --ff-only origin/main
```

미완료 변경이 보이면 먼저 내용을 확인하고 커밋하거나 임시 보관합니다. 명령이 실패하면 다음 단계로 진행하지 말고 차이를 확인하세요. 강제 초기화나 강제 푸시는 사용하지 않습니다. 패키지 목록·잠금 파일이 바뀌었으면 `npm ci`도 실행합니다.

## 검사하고 GitHub에 저장

코드를 저장하면 개발 화면에 반영됩니다. 업로드 전에는 별도 터미널에서 검사합니다.

```sh
npm run build
npm run test:unit
# 테스트 브라우저는 처음 한 번 설치
npm run test:install
npm test
```

설치된 Chrome으로 검사하려면 PowerShell에서 경로를 지정할 수 있습니다.

```powershell
$env:LINK_ON_CHROME = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test
```

브라우저 실행 자체가 실패한 경우 테스트 통과로 기록하지 않습니다. 변경한 화면과 관련된 연결·해제·제외·ON/OFF·이용 결과도 확인합니다.

VS Code **소스 제어**에서 변경 파일의 차이를 확인한 뒤 이번 수정만 **＋ → 커밋 → 푸시**합니다. 아래는 README만 수정한 경우의 예시입니다.

```sh
git diff -- README.md
git add README.md
git commit -m "docs: 서비스 소개 정리"
git push origin minseok
```

파일 저장은 로컬 파일, 커밋은 로컬 이력, 푸시는 GitHub에 반영됩니다. `minseok` 푸시는 미리보기 배포를 만들며 운영 사이트를 바꾸지 않습니다.

## 미리보기 확인과 운영 배포

1. Vercel **link-on → Deployments**에서 방금 푸시한 커밋의 **Preview / Ready**를 확인합니다.
2. [minseok 미리보기](https://link-on-git-minseok-seo9ky.vercel.app)에서 변경 화면과 동작을 확인합니다.
3. GitHub **Pull requests → New pull request**에서 **base: main / compare: minseok**으로 PR을 만듭니다.
4. 검사 결과와 변경 파일을 확인한 뒤 병합합니다. 계속 사용할 `minseok`은 삭제하지 않습니다.
5. Vercel에서 병합 커밋의 **Production / Ready**를 확인하고 [운영 사이트](https://link-on.kro.kr/)에서 다시 점검합니다.

Preview 성공과 Production 성공은 다릅니다. 기존 Git 연결·자동 배포 설정에서는 `main` 병합 후 운영 배포가 시작됩니다. 코드 수정 때마다 DNS를 다시 설정할 필요는 없습니다.

| 반영되지 않는 경우 | 확인할 곳 |
| --- | --- |
| GitHub에 변경이 없음 | 파일 저장·커밋·푸시가 모두 완료됐는지 |
| 미리보기만 생성됨 | `main` 병합 여부 |
| 배포 실패 | 해당 배포의 빌드 로그 |
| Ready인데 이전 화면임 | 커밋 번호와 Production 여부 확인 후 Ctrl+Shift+R |

## 병합 후 로컬 동기화

미완료 변경이 없는 상태에서 실행합니다.

```sh
git fetch origin
git switch main
git merge --ff-only origin/main
git switch minseok
git merge --ff-only origin/minseok
git merge --ff-only main
git push origin minseok
git status
```

작업을 마치면 `minseok`에 머뭅니다. 이전 변경을 취소할 때는 이력을 지우는 대신 `git revert <커밋번호>`로 취소 커밋을 만들고 같은 검증·병합 절차를 따릅니다.

## 체험 설정

폰 아래 **체험 설정**에서 이용 패턴·한도·날짜를 바꿀 수 있습니다. 조건 저장 후 **새 혜택 선정 실행**을 누르면 기존 연결을 유지하면서 다음 선정을 확인합니다.

결제 행사와 금액을 고른 뒤 **시연 결제 접수 → 확인 중 결제 전표 접수**를 진행하면 결과가 표시됩니다. **처음부터 다시 보기**는 현재 브라우저의 시연 상태만 초기화하며 Git 이력과는 관계없습니다.

정책은 [구현 기준](IMPLEMENTATION_GUIDE.md), 작업 범위는 [작업 규칙](../AGENTS.md), 검사 결과는 [배포 점검 기록](VALIDATION_RELEASE.md)을 참고하세요.

## QR PNG 다시 만들기

로고와 주소를 유지한 QR은 `scripts/create-qr.py`로 생성합니다. Python에 `Pillow`와 `qrcode`를 설치한 뒤 `python scripts/create-qr.py`를 실행하면 `docs/assets/LINK-ON-QR.png`가 갱신됩니다. README는 이 파일을 표시합니다. 인쇄하거나 배포하기 전 축소본에서도 주소가 인식되는지 확인하세요.
