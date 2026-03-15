# repo-shot

`repo-shot`은 로컬에서 이미 실행 중인 웹 애플리케이션에 접속해 화면을 캡처하고, README에 바로 붙여 넣을 수 있는 Markdown 섹션을 생성하는 Node.js CLI 도구다.

## 프로젝트 개요

여러 프로젝트를 동시에 운영하다 보면 문서용 스크린샷을 반복해서 찍고 정리하는 작업이 금방 번거로워진다. `repo-shot`은 프로젝트마다 다른 실행 환경은 그대로 두고, 실행 중인 로컬 앱에만 접속해서 필요한 화면을 일관된 방식으로 캡처하도록 만든다.

## 왜 이 도구를 만들었는지

- 서비스별로 스크린샷을 수동으로 찍고 파일명을 맞추는 작업을 줄이기 위해
- README 예시 섹션을 프로젝트마다 같은 형식으로 빠르게 만들기 위해
- Next.js, Spring Boot, Go처럼 스택이 달라도 동일한 문서화 흐름을 유지하기 위해

## 동작 방식

1. 개발자가 대상 애플리케이션을 로컬에서 실행한다.
2. `targets/<project>.json`에 캡처 대상 경로와 설명을 정의한다.
3. `node scripts/capture.mjs <project>`를 실행한다.
4. CLI가 Playwright Chromium으로 각 페이지에 접속해 전체 페이지 스크린샷을 저장한다.
5. 같은 설정 파일을 기준으로 `output/<project>/README-section.md`를 생성한다.

## 프로젝트 구조

```text
repo-shot/
├─ package.json
├─ playwright.config.ts
├─ scripts/
│  ├─ capture.mjs
│  ├─ generate-readme.mjs
│  └─ utils.mjs
├─ targets/
│  └─ example.json
├─ output/
│  └─ .gitkeep
└─ README.md
```

## 설정 파일 작성 방법

각 프로젝트는 `targets/` 아래에 JSON 설정 파일을 하나씩 둔다.

```json
{
  "project": "money-log",
  "baseUrl": "http://localhost:3000",
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "pages": [
    {
      "name": "main",
      "title": "메인 화면",
      "path": "/",
      "description": "서비스의 전체 흐름과 주요 기능을 보여주는 시작 화면이다.",
      "waitFor": 1000
    },
    {
      "name": "dashboard",
      "title": "대시보드",
      "path": "/dashboard",
      "description": "주요 데이터와 요약 정보를 한눈에 확인할 수 있는 화면이다.",
      "waitFor": 1000
    }
  ]
}
```

필수 필드는 다음과 같다.

- `project`: 출력 폴더 이름으로도 사용되는 프로젝트 식별자
- `baseUrl`: 로컬에서 실행 중인 앱의 주소
- `viewport.width`, `viewport.height`: 캡처에 사용할 브라우저 크기
- `pages[]`: 캡처 대상 목록
- `pages[].name`, `title`, `path`, `description`: 파일명, 섹션 제목, URL 경로, 설명

선택 필드는 `pages[].waitFor`이며, 렌더링 안정화를 위해 지정한 밀리초만큼 추가 대기한다.

## 실행 방법

먼저 의존성과 브라우저를 설치한다.

```bash
npm install
npx playwright install
```

애플리케이션을 로컬에서 실행한 뒤 캡처를 수행한다.

```bash
node scripts/capture.mjs money-log
```

또는 npm 스크립트를 사용할 수 있다.

```bash
npm run capture -- money-log
npm run capture:example
```

`example` 타깃은 `http://localhost:3000`에서 실행 중인 앱이 있을 때 성공하도록 작성되어 있다.

README 섹션만 다시 만들고 싶다면 다음 명령을 사용한다.

```bash
node scripts/generate-readme.mjs money-log
```

## 실전 작업 절차

여러 앱의 README를 실제로 갱신할 때는 아래 순서로 진행하면 가장 안전하다.

1. 대상 저장소에서 애플리케이션을 먼저 로컬 실행한다.
2. 브라우저나 `curl`로 홈 화면과 주요 경로가 실제로 열리는지 확인한다.
3. `targets/<project>.json`에 캡처할 경로를 정리한다.
4. `node scripts/capture.mjs <project>`를 실행해 스크린샷과 Markdown 섹션을 만든다.
5. 생성된 이미지를 대상 저장소의 `docs/screenshots/` 같은 문서용 경로로 옮기거나 복사한다.
6. 대상 저장소 `README.md`에 `README-section.md` 내용을 붙여 넣고 설명 문구를 프로젝트 문맥에 맞게 다듬는다.
7. 작업이 끝나면 로컬에서 띄운 앱과 컨테이너를 종료한다.

이 도구는 웹앱을 직접 실행해 주지 않는다. 앱이 꺼져 있거나 포트가 다르면 캡처가 실패하므로, 먼저 로컬 실행 상태를 맞춘 뒤 다시 시도해야 한다.

예를 들어 아래처럼 프로젝트별로 순서대로 띄우고 캡처할 수 있다.

```text
money-log      -> 앱 실행 확인 -> 캡처 -> README 반영 -> 종료
pulse-search   -> 인프라/앱 실행 확인 -> 캡처 -> README 반영 -> 종료
go-urlshortner -> 서버 실행 확인 -> 캡처 -> README 반영 -> 종료
bookmark       -> 서버 실행 확인 -> 캡처 -> README 반영 -> 종료
```

## 예시 출력

캡처가 끝나면 다음과 같은 파일이 생성된다.

```text
output/
└─ money-log/
   ├─ main.png
   ├─ dashboard.png
   └─ README-section.md
```

생성되는 Markdown 섹션 예시는 다음과 같다.

```md
## 화면 예시

### 메인 화면

서비스의 전체 흐름과 주요 기능을 보여주는 시작 화면이다.

![메인 화면](./main.png)

### 대시보드

주요 데이터와 요약 정보를 한눈에 확인할 수 있는 화면이다.

![대시보드](./dashboard.png)
```

실행 중 로그 예시는 다음과 같다.

```text
[repo-shot] Starting capture for project: money-log
[repo-shot] Opening http://localhost:3000/
[repo-shot] Screenshot saved: output/money-log/main.png
[repo-shot] README section generated: output/money-log/README-section.md
```

## 캡처가 실패할 때

가장 흔한 원인은 설정 문제가 아니라 대상 앱이 아직 실행되지 않았거나, 예상 포트와 실제 포트가 다른 경우다.

점검 순서는 아래처럼 잡는 편이 좋다.

1. `baseUrl`이 실제 실행 주소와 일치하는지 확인한다.
2. 브라우저에서 `baseUrl + path`를 직접 열어 본다.
3. 로그인, 시드 데이터, 백엔드 의존성, Docker 스택 같은 선행 조건이 필요한지 확인한다.
4. 화면이 정상으로 보이면 `capture.mjs`를 다시 실행한다.
5. 그래도 실패하면 앱 로그를 보고 애플리케이션 자체 오류를 먼저 수정한다.

`repo-shot`은 실패한 페이지에서 바로 중단하도록 만들었다. 문서화 자동화 도구이기 때문에, 잘못된 화면을 계속 저장하는 것보다 원인을 즉시 드러내는 쪽이 안전하다.

## 새 프로젝트 추가 방법

1. 대상 애플리케이션을 로컬에서 실행한다.
2. `targets/<새이름>.json` 파일을 추가한다.
3. 캡처할 경로와 설명을 `pages` 배열에 정의한다.
4. `node scripts/capture.mjs <새이름>`을 실행한다.
5. 생성된 `output/<새이름>/README-section.md`를 프로젝트 README에 옮겨 사용한다.

## 저장소에 올릴 파일

이 저장소를 GitHub 같은 원격에 올릴 때는 보통 아래 파일만 있으면 충분하다.

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `scripts/`
- `targets/`
- `.gitignore`
- `README.md`

반대로 아래 항목은 기본적으로 올리지 않는 편이 맞다.

- `node_modules/`: 설치 산출물이라서 제외
- `output/`: 실행 결과물이므로 기본적으로 제외

다만 특정 프로젝트의 예시 산출물을 문서로 같이 보관하려는 목적이 분명하다면, 그때만 `output/` 대신 대상 저장소의 `docs/screenshots/` 아래로 이미지를 옮겨 커밋하는 편이 관리하기 쉽다.

## 향후 확장 아이디어

- 로그인 세션이나 쿠키를 주입하는 옵션 추가
- 특정 셀렉터가 나타날 때까지 기다리는 대기 전략 추가
- 다크 모드나 모바일 뷰포트처럼 프로필별 캡처 지원
- 생성된 Markdown을 바로 특정 README 파일에 삽입하는 자동화
