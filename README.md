# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude AI가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹 앱입니다. 관심 있는 뉴스는 Notion에 저장할 수 있습니다.

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 인증 | Clerk |
| DB | Neon (PostgreSQL) + Drizzle ORM |
| AI | Claude API (`claude-sonnet-4-6`) |
| 노션 저장 | Notion API (`@notionhq/client`) |
| 스타일링 | Tailwind CSS v4 |

## 주요 기능

- **뉴스 수집**: 대시보드의 `뉴스 가져오기` 버튼을 누르면 여러 RSS 피드를 병렬로 수집하고, 이미 저장된 기사는 원문 URL 기준으로 중복 제거합니다.
- **AI 처리**: 수집된 기사마다 Claude API를 호출해 제목 번역, 요약, 카테고리 자동 분류를 한 번에 처리합니다.
- **카테고리 필터**: 대시보드 상단 카테고리 탭에서 원하는 카테고리의 뉴스만 볼 수 있습니다.
- **Notion 저장**: 뉴스 카드의 `뉴스 저장` 버튼을 누르면 Notion 데이터베이스에 페이지가 생성되고, 저장이 끝나면 버튼이 `저장됨`으로 바뀝니다.
- **페이지네이션**: 뉴스 목록이 많아지면 하단에 페이지 이동 UI가 표시됩니다.

## 시작하기

### 1. 환경변수 설정

`.env.example`을 참고하여 `.env.local` 파일을 만들고 아래 값을 채워주세요.

```
# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon PostgreSQL
DATABASE_URL=

# Claude API
ANTHROPIC_API_KEY=

# Notion
NOTION_API_KEY=
NOTION_DATABASE_ID=
NOTION_DATA_SOURCE_ID=
```

### 2. 의존성 설치

```bash
npm install
```

### 3. DB 스키마 반영

```bash
npm run db:push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행

npm run db:push      # DB 스키마를 Neon에 바로 반영 (개발용)
npm run db:generate  # 마이그레이션 파일 생성
npm run db:migrate   # 마이그레이션 실행
npm run db:studio    # Drizzle Studio (DB GUI) 실행
```

## 디렉토리 구조

```
src/
  app/
    (auth)/              # Clerk 인증 페이지 그룹
      sign-in/
      sign-up/
    dashboard/           # 메인 대시보드 (뉴스 카드 목록, 카테고리 필터, 페이지네이션)
    api/
      news/
        fetch/           # POST: RSS 수집 → Claude 처리 → DB 저장
      notion/
        save/            # POST: Notion에 뉴스 저장
  db/
    schema.ts            # Drizzle 테이블 정의
    index.ts             # Neon DB 연결 (drizzle 인스턴스 export)
```

자세한 아키텍처와 코딩 컨벤션은 [`CLAUDE.md`](./CLAUDE.md), 제품 요구사항은 [`PRD.md`](./PRD.md)를 참고하세요.
